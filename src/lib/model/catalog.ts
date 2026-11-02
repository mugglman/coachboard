import type { ObjectKind, PathKind, Team } from "./schema";

export const TEAM_COLORS: Record<Team, string> = {
  A: "#2563EB",
  B: "#DC2626",
  N: "#F59E0B",
};

export interface ObjectSpec {
  kind: ObjectKind;
  label: string;
  /** Standardfarbe */
  color: string;
  /** Kann sich in Animationen bewegen und Wege besitzen */
  movable: boolean;
  /** Drehbar über Transformer */
  rotatable: boolean;
  /** Radius für Trefferprüfung / Snap (Meter) */
  radius: number;
}

export const OBJECT_SPECS: Record<ObjectKind, ObjectSpec> = {
  player: { kind: "player", label: "Spieler", color: TEAM_COLORS.A, movable: true, rotatable: false, radius: 0.9 },
  goalkeeper: { kind: "goalkeeper", label: "Torwart", color: "#16A34A", movable: true, rotatable: false, radius: 0.9 },
  coach: { kind: "coach", label: "Trainer", color: "#334155", movable: true, rotatable: false, radius: 0.9 },
  ball: { kind: "ball", label: "Ball", color: "#FFFFFF", movable: true, rotatable: false, radius: 0.45 },
  cone: { kind: "cone", label: "Hütchen", color: "#F97316", movable: false, rotatable: false, radius: 0.5 },
  marker: { kind: "marker", label: "Markierungsteller", color: "#FACC15", movable: false, rotatable: false, radius: 0.4 },
  pole: { kind: "pole", label: "Stange", color: "#EF4444", movable: false, rotatable: false, radius: 0.3 },
  hurdle: { kind: "hurdle", label: "Hürde", color: "#3B82F6", movable: false, rotatable: true, radius: 0.6 },
  ring: { kind: "ring", label: "Ring", color: "#A855F7", movable: false, rotatable: false, radius: 0.5 },
  minigoal: { kind: "minigoal", label: "Minitor", color: "#FFFFFF", movable: false, rotatable: true, radius: 1.5 },
  goal: { kind: "goal", label: "Großtor", color: "#FFFFFF", movable: false, rotatable: true, radius: 2.5 },
  ladder: { kind: "ladder", label: "Koordinationsleiter", color: "#FDE047", movable: false, rotatable: true, radius: 2 },
  mannequin: { kind: "mannequin", label: "Dummy", color: "#64748B", movable: false, rotatable: true, radius: 0.7 },
  text: { kind: "text", label: "Text", color: "#FFFFFF", movable: false, rotatable: true, radius: 1 },
  zone: { kind: "zone", label: "Zone", color: "#38BDF8", movable: false, rotatable: true, radius: 2 },
};

export interface PathSpec {
  kind: PathKind;
  label: string;
  color: string;
  dash: number[] | null;
  description: string;
}

/** Linien-Konventionen, wie sie in Trainerliteratur üblich sind */
export const PATH_SPECS: Record<PathKind, PathSpec> = {
  run: { kind: "run", label: "Laufweg", color: "#FFFFFF", dash: [0.8, 0.6], description: "Gestrichelte Linie – Spieler ohne Ball" },
  pass: { kind: "pass", label: "Passweg", color: "#FDE047", dash: null, description: "Durchgezogene Linie – Ball wird gespielt" },
  dribble: { kind: "dribble", label: "Dribbling", color: "#FFFFFF", dash: null, description: "Wellenlinie – Spieler mit Ball" },
  shot: { kind: "shot", label: "Torschuss", color: "#F87171", dash: null, description: "Dicke Linie – Abschluss aufs Tor" },
};

export const PLACEABLE_GROUPS: { title: string; items: { kind: ObjectKind; team?: Team; label: string }[] }[] = [
  {
    title: "Spieler",
    items: [
      { kind: "player", team: "A", label: "Team A" },
      { kind: "player", team: "B", label: "Team B" },
      { kind: "player", team: "N", label: "Neutral" },
      { kind: "goalkeeper", label: "Torwart" },
      { kind: "coach", label: "Trainer" },
    ],
  },
  { title: "Ball", items: [{ kind: "ball", label: "Ball" }] },
  {
    title: "Material",
    items: [
      { kind: "cone", label: "Hütchen" },
      { kind: "marker", label: "Teller" },
      { kind: "pole", label: "Stange" },
      { kind: "hurdle", label: "Hürde" },
      { kind: "ring", label: "Ring" },
      { kind: "minigoal", label: "Minitor" },
      { kind: "goal", label: "Großtor" },
      { kind: "ladder", label: "Leiter" },
      { kind: "mannequin", label: "Dummy" },
    ],
  },
  {
    title: "Markierungen",
    items: [
      { kind: "zone", label: "Zone" },
      { kind: "text", label: "Text" },
    ],
  },
];

export const MATERIAL_SWATCHES = [
  "#2563EB",
  "#DC2626",
  "#16A34A",
  "#F59E0B",
  "#F97316",
  "#FACC15",
  "#A855F7",
  "#EC4899",
  "#0EA5E9",
  "#FFFFFF",
  "#334155",
  "#111827",
];
