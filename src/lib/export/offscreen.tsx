"use client";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Layer, Stage } from "react-konva";
import type Konva from "konva";
import type { Exercise } from "@/lib/model/schema";
import { boardSize } from "@/lib/model/pitch";
import { editFrame, frameAt, phaseStates, type Frame } from "@/lib/animation/engine";
import { BoardScene } from "@/components/board/BoardScene";

export interface OffscreenBoard {
  width: number;
  height: number;
  renderFrame(frame: Frame): void;
  renderTime(t: number): void;
  renderPhase(index: number): void;
  toDataURL(type?: string, quality?: number): string;
  canvas(): HTMLCanvasElement;
  destroy(): void;
}

/**
 * Rendert ein Spielfeld unabhängig vom Editor-Zoom in fester Auflösung.
 * Wird für PNG-, PDF-, Video-Export und Vorschaubilder genutzt.
 */
export function createOffscreenBoard(ex: Exercise, widthPx: number): OffscreenBoard {
  const size = boardSize(ex.pitch.format);
  const scale = widthPx / size.w;
  const width = Math.round(widthPx);
  const height = Math.round(size.h * scale);
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:fixed;left:-20000px;top:0;pointer-events:none;";
  document.body.appendChild(host);
  const root = createRoot(host);
  const states = phaseStates(ex);
  let stage: Konva.Stage | null = null;

  const renderFrame = (frame: Frame) => {
    flushSync(() => {
      root.render(
        <Stage
          ref={(s) => {
            stage = s;
          }}
          width={width}
          height={height}
          scaleX={scale}
          scaleY={scale}
        >
          <Layer listening={false}>
            <BoardScene exercise={ex} frame={frame} mode="static" />
          </Layer>
        </Stage>,
      );
    });
    stage?.draw();
  };

  const getStage = () => {
    if (!stage) throw new Error("Offscreen-Stage nicht bereit");
    return stage;
  };

  return {
    width,
    height,
    renderFrame,
    renderTime: (t) => renderFrame(frameAt(ex, t, states)),
    renderPhase: (i) => renderFrame(editFrame(ex, i, states)),
    toDataURL: (type = "image/png", quality) => getStage().toDataURL({ mimeType: type, quality, pixelRatio: 1 }),
    canvas: () => getStage().getLayers()[0].getNativeCanvasElement(),
    destroy: () => {
      root.unmount();
      host.remove();
    },
  };
}

export function renderThumbnail(ex: Exercise, width = 480): string {
  const board = createOffscreenBoard(ex, width);
  try {
    board.renderPhase(ex.phases.length - 1);
    return board.toDataURL("image/jpeg", 0.8);
  } finally {
    board.destroy();
  }
}
