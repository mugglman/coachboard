"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import type { Exercise } from "@/lib/model/schema";
import { boardSize } from "@/lib/model/pitch";
import { frameAt, phaseStates } from "@/lib/animation/engine";
import { BoardScene } from "@/components/board/BoardScene";

/** Nur-Anzeige-Spielfeld, füllt den Container vollständig aus */
export default function PlayerBoard({ exercise, time }: { exercise: Exercise; time: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 300, h: 200 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const states = useMemo(() => phaseStates(exercise), [exercise]);
  const frame = useMemo(() => frameAt(exercise, time, states), [exercise, time, states]);
  const b = boardSize(exercise.pitch.format);
  // Im Hochformat (Smartphone) Spielfeld um 90° drehen, damit es größer dargestellt wird
  const normal = Math.min(size.w / b.w, size.h / b.h);
  const rotated = Math.min(size.w / b.h, size.h / b.w);
  const rotate = rotated > normal * 1.15;
  const scale = rotate ? rotated : normal;
  const x = rotate ? (size.w + b.h * scale) / 2 : (size.w - b.w * scale) / 2;
  const y = rotate ? (size.h - b.w * scale) / 2 : (size.h - b.h * scale) / 2;
  return (
    <div ref={ref} className="h-full w-full" data-testid="player-board">
      <Stage width={size.w} height={size.h} listening={false}>
        <Layer listening={false} x={x} y={y} scaleX={scale} scaleY={scale} rotation={rotate ? 90 : 0}>
          <BoardScene exercise={exercise} frame={frame} mode="play" />
        </Layer>
      </Stage>
    </div>
  );
}
