"use client";
import { Arrow, Group, Line } from "react-konva";
import type { MovePath } from "@/lib/model/schema";
import { PATH_SPECS } from "@/lib/model/catalog";
import { slicePath, toFlat, wavePath, type Pt } from "@/lib/geometry/path";
import { sampled } from "@/lib/animation/engine";

interface Props {
  path: MovePath;
  /** Sichtbarer Anteil 0..1 */
  progress?: number;
  selected?: boolean;
  opacity?: number;
  onSelect?: () => void;
  listening?: boolean;
}

export function pathDisplayPoints(path: MovePath, progress = 1): Pt[] {
  const pts = slicePath(sampled(path), progress);
  return path.kind === "dribble" ? wavePath(pts, 0.35, 1.6) : pts;
}

export function PathShape({ path, progress = 1, selected, opacity = 1, onSelect, listening = true }: Props) {
  if (progress <= 0) return null;
  const spec = PATH_SPECS[path.kind];
  const pts = pathDisplayPoints(path, progress);
  if (pts.length < 2) return null;
  const flat = toFlat(pts);
  const width = path.kind === "shot" ? 0.3 : 0.17;
  const common = {
    points: flat,
    stroke: path.color,
    fill: path.color,
    strokeWidth: width,
    lineCap: "round" as const,
    lineJoin: "round" as const,
    dash: spec.dash ?? undefined,
    pointerLength: 0.85,
    pointerWidth: 0.75,
    hitStrokeWidth: 1.2,
    shadowColor: "black",
    shadowOpacity: 0.3,
    shadowBlur: 0.2,
  };
  return (
    <Group
      opacity={opacity}
      listening={listening}
      onClick={onSelect}
      onTap={onSelect}
      onMouseEnter={(e) => {
        const c = e.target.getStage()?.container();
        if (c && onSelect) c.style.cursor = "pointer";
      }}
      onMouseLeave={(e) => {
        const c = e.target.getStage()?.container();
        if (c) c.style.cursor = "";
      }}
    >
      {selected && <Line points={flat} stroke="#00D4B4" strokeWidth={width + 0.35} opacity={0.5} lineCap="round" lineJoin="round" />}
      {path.kind === "shot" && <Line points={flat} stroke="rgba(0,0,0,0.25)" strokeWidth={width + 0.18} lineCap="round" lineJoin="round" />}
      <Arrow {...common} />
    </Group>
  );
}
