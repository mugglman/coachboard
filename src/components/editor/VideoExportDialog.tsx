"use client";
import { useMemo, useRef, useState } from "react";
import { Loader2, Video } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { Exercise } from "@/lib/model/schema";
import { exportVideo, videoSupport, type VideoFormat } from "@/lib/export/video";
import { totalDuration } from "@/lib/animation/engine";

export function VideoExportDialog({ open, onOpenChange, exercise }: { open: boolean; onOpenChange: (o: boolean) => void; exercise: Exercise }) {
  const support = useMemo(() => (open ? videoSupport() : { mp4: false, webm: false }), [open]);
  const [chosen, setFormat] = useState<VideoFormat | null>(null);
  const format: VideoFormat = chosen ?? (support.mp4 ? "mp4" : "webm");
  const [quality, setQuality] = useState(1280);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);


  const start = async () => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setProgress(0);
    try {
      const res = await exportVideo(exercise, { format, width: quality, fps: 30, speed, onProgress: setProgress, signal: ctrl.signal });
      toast.success(res.format !== format ? `Video als ${res.format.toUpperCase()} erstellt (${format.toUpperCase()} nicht verfügbar)` : `Video (${res.format.toUpperCase()}) erstellt`);
      onOpenChange(false);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") toast.info("Videoexport abgebrochen");
      else toast.error(`Videoexport fehlgeschlagen: ${e instanceof Error ? e.message : "Unbekannt"}`);
    } finally {
      setProgress(null);
    }
  };

  const seconds = totalDuration(exercise) / speed + 1.2;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) abortRef.current?.abort();
        onOpenChange(o);
      }}
    >
      <DialogContent title="Video exportieren" description="Die Animation wird in Echtzeit aufgezeichnet. Bitte den Tab währenddessen geöffnet lassen.">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Field label="Format">
              <Select value={format} onChange={(e) => setFormat(e.target.value as VideoFormat)} disabled={progress !== null}>
                <option value="mp4" disabled={!support.mp4}>
                  MP4{support.mp4 ? "" : " (nicht verfügbar)"}
                </option>
                <option value="webm" disabled={!support.webm}>
                  WebM{support.webm ? "" : " (nicht verfügbar)"}
                </option>
              </Select>
            </Field>
            <Field label="Auflösung">
              <Select value={quality} onChange={(e) => setQuality(Number(e.target.value))} disabled={progress !== null}>
                <option value={960}>960 px</option>
                <option value={1280}>1280 px (HD)</option>
                <option value={1920}>1920 px (Full HD)</option>
              </Select>
            </Field>
            <Field label="Tempo">
              <Select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} disabled={progress !== null}>
                <option value={0.5}>0,5×</option>
                <option value={1}>1×</option>
                <option value={1.5}>1,5×</option>
                <option value={2}>2×</option>
              </Select>
            </Field>
          </div>
          {!support.mp4 && support.webm && (
            <p className="rounded-lg bg-hover p-2.5 text-[12px] text-muted-fg">
              Dieser Browser kann kein MP4 direkt aufnehmen – das Video wird als WebM gespeichert (läuft in Chrome, Firefox, VLC und den meisten Messengern).
            </p>
          )}
          {!support.mp4 && !support.webm && <p className="rounded-lg bg-hover p-2.5 text-[12px] text-danger">Dieser Browser unterstützt keine Videoaufnahme.</p>}
          {progress !== null && (
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-hover">
                <div className="h-full bg-accent transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <div className="text-[12px] text-muted-fg">Aufnahme läuft … {Math.round(progress * 100)} %</div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            {progress !== null ? (
              <Button onClick={() => abortRef.current?.abort()}>Abbrechen</Button>
            ) : (
              <Button variant="primary" onClick={start} disabled={!support.mp4 && !support.webm}>
                <Video /> Aufnehmen ({seconds.toFixed(0)} s)
              </Button>
            )}
            {progress !== null && <Loader2 className="size-5 animate-spin self-center text-accent" />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
