"use client";
import { Circle, Ellipse, Group, Line, Rect, RegularPolygon, Text } from "react-konva";
import type { BoardObject } from "@/lib/model/schema";

export function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 165;
}

function darken(hex: string, f = 0.7): string {
  const h = hex.replace("#", "");
  if (h.length < 6) return hex;
  const c = [0, 2, 4].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const SHADOW = { shadowColor: "black", shadowBlur: 0.35, shadowOpacity: 0.35, shadowOffsetX: 0.08, shadowOffsetY: 0.12 } as const;

/** Grafik eines Objekts, zentriert im Ursprung (Zone: linke obere Ecke) */
export function ObjectGraphic({ obj, selected }: { obj: BoardObject; selected?: boolean }) {
  const s = obj.size;
  const sel = selected ? { stroke: "#00D4B4", strokeWidth: 0.22 } : null;
  switch (obj.kind) {
    case "player":
    case "goalkeeper": {
      const r = 0.9 * s;
      return (
        <Group>
          {selected && <Circle radius={r + 0.35} stroke="#00D4B4" strokeWidth={0.18} />}
          <Circle radius={r} fill={obj.color} stroke="#ffffff" strokeWidth={0.14} {...SHADOW} />
          <Text
            text={obj.label}
            fontSize={(obj.label.length > 2 ? 0.75 : 0.95) * s}
            fontStyle="bold"
            fontFamily="Inter, system-ui, sans-serif"
            fill={isLight(obj.color) ? "#111827" : "#ffffff"}
            width={r * 2}
            height={r * 2}
            offsetX={r}
            offsetY={r}
            align="center"
            verticalAlign="middle"
          />
        </Group>
      );
    }
    case "coach": {
      const w = 1.7 * s;
      return (
        <Group>
          <Rect width={w} height={w} offsetX={w / 2} offsetY={w / 2} cornerRadius={0.35} fill={obj.color} stroke={selected ? "#00D4B4" : "#fff"} strokeWidth={selected ? 0.22 : 0.12} {...SHADOW} />
          <Text text={obj.label || "T"} fontSize={0.95 * s} fontStyle="bold" fill={isLight(obj.color) ? "#111" : "#fff"} width={w} height={w} offsetX={w / 2} offsetY={w / 2} align="center" verticalAlign="middle" />
        </Group>
      );
    }
    case "ball": {
      const r = 0.42 * s;
      return (
        <Group>
          {selected && <Circle radius={r + 0.25} stroke="#00D4B4" strokeWidth={0.14} />}
          <Circle radius={r} fill="#ffffff" stroke="#111827" strokeWidth={0.06} {...SHADOW} />
          <RegularPolygon sides={5} radius={r * 0.42} fill="#111827" />
        </Group>
      );
    }
    case "cone":
      return (
        <Group>
          <RegularPolygon sides={3} radius={0.6 * s} fill={obj.color} stroke={darken(obj.color)} strokeWidth={0.06} {...SHADOW} {...sel} />
          <Line points={[-0.2 * s, 0.05 * s, 0.2 * s, 0.05 * s]} stroke="rgba(255,255,255,0.8)" strokeWidth={0.08 * s} />
        </Group>
      );
    case "marker":
      return (
        <Group>
          <Circle radius={0.42 * s} fill={obj.color} stroke={darken(obj.color)} strokeWidth={0.05} {...SHADOW} {...sel} />
          <Circle radius={0.14 * s} fill="rgba(0,0,0,0.25)" />
        </Group>
      );
    case "pole":
      return (
        <Group>
          <Circle radius={0.24 * s} fill={obj.color} stroke="#ffffff" strokeWidth={0.08} {...SHADOW} {...sel} />
          <Circle radius={0.08 * s} fill="rgba(255,255,255,0.7)" />
        </Group>
      );
    case "hurdle": {
      const w = 1.4 * s;
      return (
        <Group>
          <Rect width={w} height={0.22} offsetX={w / 2} offsetY={0.11} fill={obj.color} cornerRadius={0.05} {...SHADOW} {...sel} />
          <Rect x={-w / 2} y={-0.3} width={0.12} height={0.6} fill={darken(obj.color)} />
          <Rect x={w / 2 - 0.12} y={-0.3} width={0.12} height={0.6} fill={darken(obj.color)} />
        </Group>
      );
    }
    case "ring":
      return <Circle radius={0.55 * s} stroke={selected ? "#00D4B4" : obj.color} strokeWidth={0.14} {...SHADOW} />;
    case "minigoal":
    case "goal": {
      const w = (obj.kind === "goal" ? 5 : 3) * s;
      const d = (obj.kind === "goal" ? 1.8 : 1.1) * s;
      const net = [];
      for (let y = -w / 2 + 0.4; y < w / 2; y += 0.4) net.push(<Line key={`y${y}`} points={[-d, y, 0, y]} stroke="rgba(255,255,255,0.35)" strokeWidth={0.035} />);
      for (let x = -d + 0.4; x < 0; x += 0.4) net.push(<Line key={`x${x}`} points={[x, -w / 2, x, w / 2]} stroke="rgba(255,255,255,0.35)" strokeWidth={0.035} />);
      return (
        <Group>
          <Rect x={-d} y={-w / 2} width={d} height={w} fill="rgba(255,255,255,0.14)" />
          {net}
          <Line points={[0, -w / 2, -d, -w / 2, -d, w / 2, 0, w / 2]} stroke={selected ? "#00D4B4" : obj.color} strokeWidth={0.2} lineJoin="round" {...SHADOW} />
        </Group>
      );
    }
    case "ladder": {
      const len = 4 * s;
      const w = 0.6;
      const rungs = [];
      for (let x = -len / 2 + 0.45; x < len / 2; x += 0.45) rungs.push(<Line key={x} points={[x, -w / 2, x, w / 2]} stroke={obj.color} strokeWidth={0.07} />);
      return (
        <Group>
          <Rect width={len} height={w} offsetX={len / 2} offsetY={w / 2} stroke={selected ? "#00D4B4" : obj.color} strokeWidth={0.09} fill="rgba(0,0,0,0.08)" />
          {rungs}
        </Group>
      );
    }
    case "mannequin":
      return (
        <Group>
          <Ellipse radiusX={0.75 * s} radiusY={0.32 * s} fill={obj.color} stroke={selected ? "#00D4B4" : "#ffffff"} strokeWidth={0.08} {...SHADOW} />
          <Circle radius={0.24 * s} fill={darken(obj.color, 0.8)} stroke="#ffffff" strokeWidth={0.05} />
        </Group>
      );
    case "text": {
      const fs = 1.3 * s;
      return (
        <Text
          text={obj.label || "Text"}
          fontSize={fs}
          fontStyle="bold"
          fontFamily="Inter, system-ui, sans-serif"
          fill={obj.color}
          stroke={selected ? "#00D4B4" : undefined}
          strokeWidth={selected ? 0.04 : 0}
          shadowColor="black"
          shadowBlur={0.3}
          shadowOpacity={0.5}
          offsetY={fs / 2}
        />
      );
    }
    case "zone": {
      const w = obj.width ?? 10;
      const h = obj.height ?? 8;
      return (
        <Group>
          <Rect width={w} height={h} fill={obj.color} opacity={0.2} cornerRadius={0.3} />
          <Rect width={w} height={h} stroke={selected ? "#00D4B4" : obj.color} strokeWidth={0.12} dash={[0.6, 0.4]} cornerRadius={0.3} />
          {obj.label ? <Text x={0.4} y={0.35} text={obj.label} fontSize={0.9} fontStyle="bold" fill="#ffffff" opacity={0.95} /> : null}
        </Group>
      );
    }
  }
}
