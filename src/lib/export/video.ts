"use client";
import type { Exercise } from "@/lib/model/schema";
import { totalDuration } from "@/lib/animation/engine";
import { createOffscreenBoard } from "./offscreen";
import { downloadBlob, slugify } from "@/lib/utils";

export type VideoFormat = "mp4" | "webm";

const CANDIDATES: Record<VideoFormat, string[]> = {
  mp4: ["video/mp4;codecs=avc1.42E01E", "video/mp4;codecs=avc1", "video/mp4"],
  webm: ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"],
};

export function supportedMime(format: VideoFormat): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  return CANDIDATES[format].find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

export function videoSupport(): { mp4: boolean; webm: boolean } {
  return { mp4: !!supportedMime("mp4"), webm: !!supportedMime("webm") };
}

export interface VideoOptions {
  format: VideoFormat;
  width: number;
  fps: number;
  speed: number;
  onProgress?: (p: number) => void;
  signal?: AbortSignal;
}

/**
 * Nimmt die Animation in Echtzeit über MediaRecorder auf.
 * MP4 wird genutzt, wenn der Browser es nativ aufnehmen kann (Chrome ≥ 126,
 * Safari), sonst WebM als robuster Fallback.
 */
export async function exportVideo(ex: Exercise, opts: VideoOptions): Promise<{ format: VideoFormat }> {
  let format = opts.format;
  let mime = supportedMime(format);
  if (!mime) {
    format = format === "mp4" ? "webm" : "mp4";
    mime = supportedMime(format);
  }
  if (!mime) throw new Error("Dieser Browser unterstützt keine Videoaufnahme (MediaRecorder).");

  const board = createOffscreenBoard(ex, opts.width);
  const hold = 0.6;
  const total = totalDuration(ex) / opts.speed;
  const length = total + hold * 2;
  try {
    board.renderTime(0);
    const canvas = board.canvas();
    const stream = canvas.captureStream(opts.fps);
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
    recorder.start(250);

    await new Promise<void>((resolve, reject) => {
      const start = performance.now();
      const tick = () => {
        if (opts.signal?.aborted) {
          reject(new DOMException("Abgebrochen", "AbortError"));
          return;
        }
        const elapsed = (performance.now() - start) / 1000;
        const t = Math.min(total, Math.max(0, elapsed - hold)) * opts.speed;
        board.renderTime(t);
        opts.onProgress?.(Math.min(1, elapsed / length));
        if (elapsed >= length) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }).finally(() => {
      if (recorder.state !== "inactive") recorder.stop();
    });
    await stopped;
    stream.getTracks().forEach((t) => t.stop());
    const blob = new Blob(chunks, { type: mime.split(";")[0] });
    downloadBlob(blob, `${slugify(ex.name)}.${format}`);
    return { format };
  } finally {
    board.destroy();
  }
}
