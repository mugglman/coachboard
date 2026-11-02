import type { Exercise, MovePath, Phase } from "@/lib/model/schema";
import { pointAt, samplePath, type Pt } from "@/lib/geometry/path";

/**
 * Zeitbasierte Animationsengine.
 *
 * Modell: Jeder Schritt (Phase) ist ein Keyframe. Ein Schritt animiert vom
 * Endzustand des vorherigen Schritts (bzw. den Startpositionen der Objekte)
 * zu seinem eigenen Endzustand. Objekte, die einem Weg zugeordnet sind,
 * folgen der Bahn des Weges innerhalb des Zeitfensters [start, end].
 * Alle anderen veränderten Objekte werden linear/weich interpoliert.
 */

export interface Pose {
  x: number;
  y: number;
  rotation: number;
}
export type PoseMap = Record<string, Pose>;

export interface Frame {
  poses: PoseMap;
  phaseIndex: number;
  /** 0..1 innerhalb des aktuellen Schritts */
  phaseProgress: number;
  /** Fortschritt aller Wege des aktuellen Schritts 0..1 */
  pathProgress: Record<string, number>;
}

/** Abstand Ball vor dem Fuß beim Dribbling (Meter) */
export const CARRY_OFFSET = 0.75;

export const easings = {
  linear: (t: number) => t,
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function lerpAngle(a: number, b: number, t: number): number {
  let d = ((b - a + 540) % 360) - 180;
  if (d < -180) d += 360;
  return a + d * t;
}

export function basePoses(ex: Exercise): PoseMap {
  const map: PoseMap = {};
  for (const o of ex.objects) map[o.id] = { x: o.x, y: o.y, rotation: o.rotation };
  return map;
}

const sampleCache = new WeakMap<number[], Pt[]>();
export function sampled(path: MovePath): Pt[] {
  let s = sampleCache.get(path.points);
  if (!s) {
    s = samplePath(path.points);
    sampleCache.set(path.points, s);
  }
  return s;
}

function carryPoint(pts: Pt[], t: number): Pt {
  const p = pointAt(pts, t);
  return { x: p.x + Math.cos(p.angle) * CARRY_OFFSET, y: p.y + Math.sin(p.angle) * CARRY_OFFSET };
}

/** Wendet einen Schritt auf einen Ausgangszustand an und liefert den Endzustand */
export function applyPhase(before: PoseMap, phase: Phase): PoseMap {
  const after: PoseMap = { ...before };
  for (const [id, pos] of Object.entries(phase.positions)) {
    const prev = after[id];
    if (!prev) continue;
    after[id] = { x: pos.x, y: pos.y, rotation: pos.rotation ?? prev.rotation };
  }
  for (const path of phase.paths) {
    const pts = sampled(path);
    if (path.objectId && after[path.objectId]) {
      const end = pts[pts.length - 1];
      after[path.objectId] = { ...after[path.objectId], x: end.x, y: end.y };
    }
    if (path.carryId && after[path.carryId]) {
      const c = carryPoint(pts, 1);
      after[path.carryId] = { ...after[path.carryId], x: c.x, y: c.y };
    }
  }
  return after;
}

/** Zustand VOR jedem Schritt (Index i) und Endzustand nach dem letzten */
export function phaseStates(ex: Exercise): { before: PoseMap[]; after: PoseMap[] } {
  const before: PoseMap[] = [];
  const after: PoseMap[] = [];
  let cur = basePoses(ex);
  for (const phase of ex.phases) {
    before.push(cur);
    cur = applyPhase(cur, phase);
    after.push(cur);
  }
  return { before, after };
}

export function phaseStartTimes(ex: Exercise): number[] {
  const out: number[] = [];
  let t = 0;
  for (const p of ex.phases) {
    out.push(t);
    t += p.duration;
  }
  return out;
}

export function totalDuration(ex: Exercise): number {
  return ex.phases.reduce((s, p) => s + p.duration, 0);
}

export function phaseIndexAt(ex: Exercise, time: number): number {
  const starts = phaseStartTimes(ex);
  for (let i = starts.length - 1; i >= 0; i--) if (time >= starts[i]) return i;
  return 0;
}

export function pathProgress(path: MovePath, u: number): number {
  const span = Math.max(0.0001, path.end - path.start);
  return easings[path.easing](clamp01((u - path.start) / span));
}

/** Kompletter Frame zu einem Zeitpunkt (Sekunden) */
export function frameAt(ex: Exercise, time: number, states = phaseStates(ex)): Frame {
  const total = totalDuration(ex);
  const t = Math.min(Math.max(0, time), total);
  const idx = phaseIndexAt(ex, t);
  const phase = ex.phases[idx];
  const start = phaseStartTimes(ex)[idx];
  const u = phase.duration > 0 ? clamp01((t - start) / phase.duration) : 1;
  const before = states.before[idx];
  const after = states.after[idx];
  const poses: PoseMap = {};
  const progress: Record<string, number> = {};

  const driven = new Set<string>();
  for (const path of phase.paths) {
    const p = pathProgress(path, u);
    progress[path.id] = p;
    const pts = sampled(path);
    if (path.objectId && before[path.objectId]) {
      const pt = pointAt(pts, p);
      poses[path.objectId] = { x: pt.x, y: pt.y, rotation: after[path.objectId].rotation };
      driven.add(path.objectId);
    }
    if (path.carryId && before[path.carryId]) {
      // Ball bleibt bis zum Start des Dribblings an seiner Position und wird dann geführt
      const c = p <= 0 ? before[path.carryId] : carryPoint(pts, p);
      poses[path.carryId] = { x: c.x, y: c.y, rotation: after[path.carryId].rotation };
      driven.add(path.carryId);
    }
  }

  const k = easings.easeInOut(u);
  for (const id of Object.keys(after)) {
    if (driven.has(id)) continue;
    const a = before[id] ?? after[id];
    const b = after[id];
    poses[id] =
      a.x === b.x && a.y === b.y && a.rotation === b.rotation
        ? b
        : { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), rotation: lerpAngle(a.rotation, b.rotation, k) };
  }

  return { poses, phaseIndex: idx, phaseProgress: u, pathProgress: progress };
}

/** Statischer Endzustand eines Schritts für den Editor */
export function editFrame(ex: Exercise, phaseIndex: number, states = phaseStates(ex)): Frame {
  const idx = Math.min(Math.max(0, phaseIndex), ex.phases.length - 1);
  const progress: Record<string, number> = {};
  for (const path of ex.phases[idx].paths) progress[path.id] = 1;
  return { poses: states.after[idx], phaseIndex: idx, phaseProgress: 1, pathProgress: progress };
}
