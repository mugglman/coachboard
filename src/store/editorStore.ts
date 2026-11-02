"use client";

import { create } from "zustand";
import { OBJECT_SPECS } from "@/lib/model/catalog";
import { createObject, createPath, createPhase, newId } from "@/lib/model/factory";
import type { BoardObject, Exercise, MovePath, ObjectKind, PathKind, Phase, Team } from "@/lib/model/schema";
import { phaseStates, totalDuration, phaseStartTimes } from "@/lib/animation/engine";
import { dist, simplify, toFlat, type Pt } from "@/lib/geometry/path";

export type Tool =
  | { type: "select" }
  | { type: "pan" }
  | { type: "place"; kind: ObjectKind; team?: Team }
  | { type: "path"; kind: PathKind };

export type Selection = { type: "object" | "path"; id: string } | null;
export type SaveStatus = "saved" | "saving" | "dirty" | "error";
export type RightTab = "steps" | "objects" | "properties" | "info";

const HISTORY_LIMIT = 100;
const LINK_RADIUS = 2.2;

interface EditorState {
  exercise: Exercise | null;
  past: Exercise[];
  future: Exercise[];
  phaseIndex: number;
  selection: Selection;
  tool: Tool;
  clipboard: BoardObject | null;

  // Wiedergabe
  playing: boolean;
  time: number;
  speed: number;
  loop: boolean;

  // Ansicht
  zoom: number;
  fitRequest: number;
  leftOpen: boolean;
  rightOpen: boolean;
  timelineOpen: boolean;
  timelineHeight: number;
  rightTab: RightTab;
  onionSkin: boolean;
  snap: boolean;
  saveStatus: SaveStatus;

  load(ex: Exercise): void;
  reset(): void;
  /** Ändert die Übung mit Undo-Eintrag */
  update(mutator: (draft: Exercise) => void): void;
  undo(): void;
  redo(): void;

  setTool(tool: Tool): void;
  select(sel: Selection): void;
  setPhaseIndex(i: number): void;

  addObject(kind: ObjectKind, x: number, y: number, team?: Team): string;
  updateObject(id: string, patch: Partial<BoardObject>): void;
  moveObject(id: string, x: number, y: number): void;
  rotateObject(id: string, rotation: number): void;
  resizeZone(id: string, x: number, y: number, width: number, height: number, rotation: number): void;
  deleteSelection(): void;
  duplicateSelection(): void;
  copySelection(): void;
  paste(): void;

  addPath(kind: PathKind, raw: Pt[]): string | null;
  updatePath(id: string, patch: Partial<MovePath>): void;

  addPhase(): void;
  duplicatePhase(index: number): void;
  deletePhase(index: number): void;
  movePhase(index: number, dir: -1 | 1): void;
  updatePhase(index: number, patch: Partial<Phase>): void;

  setPlaying(p: boolean): void;
  setTime(t: number): void;
  setSpeed(s: number): void;
  setLoop(l: boolean): void;

  setZoom(z: number): void;
  requestFit(): void;
  setUi(patch: Partial<Pick<EditorState, "leftOpen" | "rightOpen" | "timelineOpen" | "timelineHeight" | "rightTab" | "onionSkin" | "snap">>): void;
  setSaveStatus(s: SaveStatus): void;
}

const clone = <T,>(v: T): T => structuredClone(v);

function findPath(ex: Exercise, id: string): { phase: Phase; path: MovePath } | null {
  for (const phase of ex.phases) {
    const path = phase.paths.find((p) => p.id === id);
    if (path) return { phase, path };
  }
  return null;
}

const initialView = {
  phaseIndex: 0,
  selection: null as Selection,
  tool: { type: "select" } as Tool,
  playing: false,
  time: 0,
  speed: 1,
  loop: false,
};

export const useEditor = create<EditorState>()((set, get) => ({
  exercise: null,
  past: [],
  future: [],
  clipboard: null,
  ...initialView,
  zoom: 1,
  fitRequest: 0,
  leftOpen: true,
  rightOpen: true,
  timelineOpen: true,
  timelineHeight: 180,
  rightTab: "steps",
  onionSkin: true,
  snap: false,
  saveStatus: "saved",

  load(ex) {
    set({ exercise: ex, past: [], future: [], ...initialView, time: ex.phases[0]?.duration ?? 0, saveStatus: "saved" });
  },
  reset() {
    set({ exercise: null, past: [], future: [], ...initialView });
  },

  update(mutator) {
    const cur = get().exercise;
    if (!cur) return;
    const next = clone(cur);
    mutator(next);
    next.updatedAt = new Date().toISOString();
    set((s) => ({
      exercise: next,
      past: [...s.past, cur].slice(-HISTORY_LIMIT),
      future: [],
      saveStatus: "dirty",
    }));
  },
  undo() {
    const { past, exercise, future } = get();
    if (!past.length || !exercise) return;
    const prev = past[past.length - 1];
    set({
      exercise: prev,
      past: past.slice(0, -1),
      future: [exercise, ...future],
      saveStatus: "dirty",
      phaseIndex: Math.min(get().phaseIndex, prev.phases.length - 1),
      selection: null,
    });
  },
  redo() {
    const { past, exercise, future } = get();
    if (!future.length || !exercise) return;
    const next = future[0];
    set({
      exercise: next,
      past: [...past, exercise],
      future: future.slice(1),
      saveStatus: "dirty",
      phaseIndex: Math.min(get().phaseIndex, next.phases.length - 1),
      selection: null,
    });
  },

  setTool(tool) {
    set({ tool, selection: tool.type === "select" ? get().selection : null });
  },
  select(selection) {
    set({ selection });
  },
  setPhaseIndex(i) {
    const ex = get().exercise;
    if (!ex) return;
    const idx = Math.max(0, Math.min(ex.phases.length - 1, i));
    const starts = phaseStartTimes(ex);
    set({ phaseIndex: idx, playing: false, time: starts[idx] + ex.phases[idx].duration });
  },

  addObject(kind, x, y, team) {
    const ex = get().exercise;
    if (!ex) return "";
    const obj = createObject(kind, x, y, { team, existing: ex.objects });
    get().update((d) => {
      d.objects.push(obj);
      // In späteren Schritten neu platzierte Spieler erscheinen bereits ab Start an dieser Position
    });
    set({ selection: { type: "object", id: obj.id } });
    return obj.id;
  },
  updateObject(id, patch) {
    get().update((d) => {
      const o = d.objects.find((x) => x.id === id);
      if (o) Object.assign(o, patch);
    });
  },
  moveObject(id, x, y) {
    const { phaseIndex } = get();
    get().update((d) => {
      const obj = d.objects.find((o) => o.id === id);
      if (!obj) return;
      const phase = d.phases[phaseIndex];
      // Statisches Material gilt in allen Schritten gleich
      if (!OBJECT_SPECS[obj.kind].movable) {
        obj.x = x;
        obj.y = y;
        return;
      }
      const linked = phase.paths.find((p) => p.objectId === id);
      if (linked) {
        const n = linked.points.length;
        linked.points = [...linked.points.slice(0, n - 2), x, y];
        return;
      }
      const carried = phase.paths.find((p) => p.carryId === id);
      if (carried) carried.carryId = undefined;
      if (phaseIndex === 0) {
        obj.x = x;
        obj.y = y;
        delete phase.positions[id];
        return;
      }
      const before = phaseStates(d).before[phaseIndex][id];
      if (before && dist(before, { x, y }) < 0.01) delete phase.positions[id];
      else phase.positions[id] = { ...(phase.positions[id] ?? {}), x, y };
    });
  },
  rotateObject(id, rotation) {
    const { phaseIndex } = get();
    get().update((d) => {
      const obj = d.objects.find((o) => o.id === id);
      if (!obj) return;
      if (!OBJECT_SPECS[obj.kind].movable || phaseIndex === 0) {
        obj.rotation = rotation;
        return;
      }
      const after = phaseStates(d).after[phaseIndex][id];
      const phase = d.phases[phaseIndex];
      const prev = phase.positions[id];
      phase.positions[id] = { x: prev?.x ?? after.x, y: prev?.y ?? after.y, rotation };
    });
  },
  resizeZone(id, x, y, width, height, rotation) {
    get().update((d) => {
      const o = d.objects.find((v) => v.id === id);
      if (!o) return;
      Object.assign(o, { x, y, width: Math.max(0.5, width), height: Math.max(0.5, height), rotation });
    });
  },
  deleteSelection() {
    const { selection } = get();
    if (!selection) return;
    get().update((d) => {
      if (selection.type === "object") {
        d.objects = d.objects.filter((o) => o.id !== selection.id);
        for (const p of d.phases) {
          delete p.positions[selection.id];
          for (const path of p.paths) {
            if (path.objectId === selection.id) path.objectId = undefined;
            if (path.carryId === selection.id) path.carryId = undefined;
          }
        }
      } else {
        for (const p of d.phases) p.paths = p.paths.filter((x) => x.id !== selection.id);
      }
    });
    set({ selection: null });
  },
  duplicateSelection() {
    get().copySelection();
    get().paste();
  },
  copySelection() {
    const { selection, exercise } = get();
    if (!exercise || selection?.type !== "object") return;
    const o = exercise.objects.find((x) => x.id === selection.id);
    if (o) set({ clipboard: clone(o) });
  },
  paste() {
    const { clipboard, exercise, phaseIndex } = get();
    if (!clipboard || !exercise) return;
    const states = phaseStates(exercise);
    const pose = states.after[phaseIndex][clipboard.id] ?? clipboard;
    const id = newId();
    get().update((d) => {
      const copy: BoardObject = { ...clone(clipboard), id, x: pose.x + 1.5, y: pose.y + 1.5 };
      if (copy.kind === "player") {
        const used = new Set(d.objects.filter((o) => o.kind === "player" && o.team === copy.team).map((o) => o.label));
        let n = 1;
        while (used.has(String(n))) n++;
        copy.label = String(n);
      }
      d.objects.push(copy);
    });
    set({ selection: { type: "object", id } });
  },

  addPath(kind, raw) {
    const ex = get().exercise;
    if (!ex || raw.length < 2) return null;
    const totalLen = raw.reduce((s, p, i) => (i ? s + dist(raw[i - 1], p) : 0), 0);
    if (totalLen < 1) return null;
    const pts = simplify(raw, 0.35);
    const { phaseIndex } = get();
    const states = phaseStates(ex);
    const before = states.before[phaseIndex];
    const after = states.after[phaseIndex];
    const phase = ex.phases[phaseIndex];
    const busy = new Set(phase.paths.flatMap((p) => [p.objectId, p.carryId]).filter(Boolean) as string[]);
    const start = pts[0];

    const candidates = (kinds: ObjectKind[]) =>
      ex.objects
        .filter((o) => kinds.includes(o.kind) && !busy.has(o.id))
        .map((o) => ({ o, d: Math.min(dist(after[o.id], start), dist(before[o.id], start)) }))
        .filter((c) => c.d <= LINK_RADIUS)
        .sort((a, b) => a.d - b.d);

    let objectId: string | undefined;
    let carryId: string | undefined;
    const people: ObjectKind[] = ["player", "goalkeeper", "coach"];
    if (kind === "pass" || kind === "shot") {
      objectId = candidates(["ball"])[0]?.o.id;
    } else {
      objectId = candidates(people)[0]?.o.id;
      if (kind === "dribble" && objectId) {
        const p = before[objectId];
        const ball = ex.objects
          .filter((o) => o.kind === "ball" && !busy.has(o.id))
          .map((o) => ({ o, d: dist(before[o.id], p) }))
          .filter((c) => c.d <= LINK_RADIUS + 0.5)
          .sort((a, b) => a.d - b.d)[0];
        carryId = ball?.o.id;
      }
    }
    if (objectId) {
      // Weg beginnt exakt an der Position vor diesem Schritt
      pts[0] = { x: before[objectId].x, y: before[objectId].y };
    }
    const path = createPath(kind, toFlat(pts), { objectId, carryId });
    get().update((d) => {
      const ph = d.phases[phaseIndex];
      if (objectId) delete ph.positions[objectId];
      if (carryId) delete ph.positions[carryId];
      ph.paths.push(path);
    });
    set({ selection: { type: "path", id: path.id } });
    return path.id;
  },
  updatePath(id, patch) {
    get().update((d) => {
      const f = findPath(d, id);
      if (f) Object.assign(f.path, patch);
    });
  },

  addPhase() {
    const ex = get().exercise;
    if (!ex) return;
    get().update((d) => {
      d.phases.push(createPhase(d.phases.length));
    });
    get().setPhaseIndex(ex.phases.length);
  },
  duplicatePhase(index) {
    get().update((d) => {
      const src = d.phases[index];
      const copy: Phase = {
        ...clone(src),
        id: newId(),
        name: `${src.name} (Kopie)`,
        paths: src.paths.map((p) => ({ ...clone(p), id: newId() })),
      };
      d.phases.splice(index + 1, 0, copy);
    });
    get().setPhaseIndex(index + 1);
  },
  deletePhase(index) {
    const ex = get().exercise;
    if (!ex || ex.phases.length <= 1) return;
    get().update((d) => {
      d.phases.splice(index, 1);
    });
    get().setPhaseIndex(Math.max(0, index - 1));
  },
  movePhase(index, dir) {
    const ex = get().exercise;
    if (!ex) return;
    const target = index + dir;
    if (target < 0 || target >= ex.phases.length) return;
    get().update((d) => {
      const [p] = d.phases.splice(index, 1);
      d.phases.splice(target, 0, p);
    });
    get().setPhaseIndex(target);
  },
  updatePhase(index, patch) {
    get().update((d) => {
      Object.assign(d.phases[index], patch);
    });
  },

  setPlaying(playing) {
    const ex = get().exercise;
    if (!ex) return;
    if (playing && get().time >= totalDuration(ex) - 0.001) set({ time: 0 });
    set({ playing, selection: playing ? null : get().selection });
  },
  setTime(time) {
    const ex = get().exercise;
    if (!ex) return;
    const t = Math.max(0, Math.min(totalDuration(ex), time));
    const starts = phaseStartTimes(ex);
    let idx = 0;
    for (let i = starts.length - 1; i >= 0; i--)
      if (t >= starts[i]) {
        idx = i;
        break;
      }
    set({ time: t, phaseIndex: idx });
  },
  setSpeed(speed) {
    set({ speed });
  },
  setLoop(loop) {
    set({ loop });
  },

  setZoom(z) {
    set({ zoom: Math.max(0.2, Math.min(5, z)) });
  },
  requestFit() {
    set((s) => ({ fitRequest: s.fitRequest + 1 }));
  },
  setUi(patch) {
    set(patch);
  },
  setSaveStatus(saveStatus) {
    set({ saveStatus });
  },
}));

/** Prüft, ob die Anzeige gerade den animierten Zeitpunkt statt des Schritt-Endzustands zeigen soll */
export function isScrubbing(s: Pick<EditorState, "playing" | "time" | "exercise" | "phaseIndex">): boolean {
  if (!s.exercise) return false;
  if (s.playing) return true;
  const starts = phaseStartTimes(s.exercise);
  const end = starts[s.phaseIndex] + s.exercise.phases[s.phaseIndex].duration;
  return Math.abs(s.time - end) > 0.001;
}

