"use client";
import { Group, Rect, Line, Circle, Shape } from "react-konva";
import type { PitchConfig } from "@/lib/model/schema";
import { PITCH_SPECS, PITCH_MARGIN } from "@/lib/model/pitch";

const PALETTES = {
  natur: { outside: "#2f7a3d", a: "#3c8e49", b: "#44994f", line: "rgba(255,255,255,0.92)" },
  dunkel: { outside: "#163c28", a: "#1f4d33", b: "#235538", line: "rgba(255,255,255,0.8)" },
} as const;

const LW = 0.12;

function Arc({ cx, cy, r, from, to, color }: { cx: number; cy: number; r: number; from: number; to: number; color: string }) {
  return (
    <Shape
      sceneFunc={(ctx, shape) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, from, to, false);
        ctx.strokeShape(shape);
      }}
      stroke={color}
      strokeWidth={LW}
      listening={false}
    />
  );
}

function GoalShape({ x, y, w, depth, dir }: { x: number; y: number; w: number; depth: number; dir: -1 | 1 }) {
  const gx = dir === -1 ? x - depth : x;
  const lines = [];
  for (let i = 0.5; i < w; i += 0.5) lines.push(<Line key={`h${i}`} points={[gx, y + i, gx + depth, y + i]} stroke="rgba(255,255,255,0.35)" strokeWidth={0.04} />);
  for (let i = 0.5; i < depth; i += 0.5) lines.push(<Line key={`v${i}`} points={[gx + i, y, gx + i, y + w]} stroke="rgba(255,255,255,0.35)" strokeWidth={0.04} />);
  return (
    <Group listening={false}>
      <Rect x={gx} y={y} width={depth} height={w} fill="rgba(255,255,255,0.12)" />
      {lines}
      <Line
        points={dir === -1 ? [x, y, gx, y, gx, y + w, x, y + w] : [x, y, x + depth, y, x + depth, y + w, x, y + w]}
        stroke="#ffffff"
        strokeWidth={0.18}
        lineJoin="round"
      />
    </Group>
  );
}

/** Zeichnet das Spielfeld in Metern (Ursprung = linke obere Ecke der Spielfläche) */
export function PitchLayer({ pitch }: { pitch: PitchConfig }) {
  const spec = PITCH_SPECS[pitch.format];
  const pal = PALETTES[pitch.variant];
  const L = spec.length;
  const W = spec.width;
  const M = PITCH_MARGIN;
  const midY = W / 2;

  const stripeW = pitch.format === "frei" ? 5 : L / (spec.half ? 6 : 12);
  const stripes = [];
  if (pitch.stripes) {
    for (let i = 0, x = 0; x < L; i++, x += stripeW) {
      if (i % 2 === 1) stripes.push(<Rect key={i} x={x} y={0} width={Math.min(stripeW, L - x)} height={W} fill={pal.b} />);
    }
  }

  const sides: (-1 | 1)[] = spec.half ? [1] : [-1, 1];
  const c = pal.line;

  return (
    <Group listening={false}>
      <Rect x={-M} y={-M} width={L + 2 * M} height={W + 2 * M} fill={pal.outside} />
      <Rect x={0} y={0} width={L} height={W} fill={pal.a} />
      {stripes}
      {spec.markings ? (
        <Group>
          <Rect x={0} y={0} width={L} height={W} stroke={c} strokeWidth={LW} />
          {spec.half ? (
            <>
              <Arc cx={0} cy={midY} r={spec.centerRadius} from={-Math.PI / 2} to={Math.PI / 2} color={c} />
              <Circle x={0} y={midY} radius={0.25} fill={c} />
            </>
          ) : (
            <>
              <Line points={[L / 2, 0, L / 2, W]} stroke={c} strokeWidth={LW} />
              <Circle x={L / 2} y={midY} radius={spec.centerRadius} stroke={c} strokeWidth={LW} />
              <Circle x={L / 2} y={midY} radius={0.25} fill={c} />
            </>
          )}
          {sides.map((dir) => {
            const gx = dir === -1 ? 0 : L;
            const into = dir === -1 ? 1 : -1;
            const pa = spec.penaltyDepth;
            const spot = gx + into * spec.penaltySpot;
            const R = spec.centerRadius;
            const rel = (pa - spec.penaltySpot) / R;
            const theta = rel < 1 ? Math.acos(Math.max(-1, rel)) : 0;
            return (
              <Group key={dir}>
                {pa > 0 && (
                  <Rect
                    x={dir === -1 ? 0 : L - pa}
                    y={midY - spec.penaltyWidth / 2}
                    width={pa}
                    height={spec.penaltyWidth}
                    stroke={c}
                    strokeWidth={LW}
                  />
                )}
                {spec.goalAreaDepth > 0 && (
                  <Rect
                    x={dir === -1 ? 0 : L - spec.goalAreaDepth}
                    y={midY - spec.goalAreaWidth / 2}
                    width={spec.goalAreaDepth}
                    height={spec.goalAreaWidth}
                    stroke={c}
                    strokeWidth={LW}
                  />
                )}
                {spec.penaltySpot > 0 && <Circle x={spot} y={midY} radius={0.2} fill={c} />}
                {theta > 0 &&
                  (dir === -1 ? (
                    <Arc cx={spot} cy={midY} r={R} from={-theta} to={theta} color={c} />
                  ) : (
                    <Arc cx={spot} cy={midY} r={R} from={Math.PI - theta} to={Math.PI + theta} color={c} />
                  ))}
                {spec.goalWidth > 0 && <GoalShape x={gx} y={midY - spec.goalWidth / 2} w={spec.goalWidth} depth={spec.goalDepth} dir={dir} />}
              </Group>
            );
          })}
          {/* Eckviertelkreise */}
          {(spec.half ? [[L, 0, Math.PI / 2, Math.PI], [L, W, Math.PI, Math.PI * 1.5]] : [
            [0, 0, 0, Math.PI / 2],
            [L, 0, Math.PI / 2, Math.PI],
            [L, W, Math.PI, Math.PI * 1.5],
            [0, W, Math.PI * 1.5, Math.PI * 2],
          ]).map(([x, y, a, b], i) => (
            <Arc key={i} cx={x} cy={y} r={1} from={a} to={b} color={c} />
          ))}
        </Group>
      ) : (
        <Rect x={0} y={0} width={L} height={W} stroke="rgba(255,255,255,0.35)" strokeWidth={LW} dash={[0.6, 0.6]} />
      )}
    </Group>
  );
}
