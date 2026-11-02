import { nanoid } from "nanoid";
import { OBJECT_SPECS, PATH_SPECS, TEAM_COLORS } from "./catalog";
import {
  SCHEMA_VERSION,
  type BoardObject,
  type Exercise,
  type MovePath,
  type ObjectKind,
  type PathKind,
  type Phase,
  type PitchFormat,
  type Team,
  type TrainingSession,
} from "./schema";

export const newId = (): string => nanoid(10);
const now = (): string => new Date().toISOString();

export function createPhase(index: number, partial: Partial<Phase> = {}): Phase {
  return {
    id: newId(),
    name: `Schritt ${index + 1}`,
    duration: 3,
    note: "",
    positions: {},
    paths: [],
    ...partial,
  };
}

export function createExercise(partial: Partial<Exercise> = {}, format: PitchFormat = "7er"): Exercise {
  const ts = now();
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId(),
    name: "Neue Übung",
    description: "",
    category: "Passspiel",
    ageGroup: "E-Jugend",
    playerCount: "",
    durationMinutes: 15,
    material: "",
    goals: "",
    coachingPoints: "",
    variations: "",
    tags: [],
    pitch: { format, stripes: true, variant: "natur" },
    objects: [],
    phases: [createPhase(0)],
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  };
}

export function nextPlayerNumber(objects: BoardObject[], team: Team): string {
  const used = new Set(
    objects.filter((o) => (o.kind === "player" || o.kind === "goalkeeper") && o.team === team).map((o) => o.label),
  );
  for (let n = 1; n < 100; n++) if (!used.has(String(n))) return String(n);
  return "";
}

export function createObject(
  kind: ObjectKind,
  x: number,
  y: number,
  opts: { team?: Team; existing?: BoardObject[] } = {},
): BoardObject {
  const spec = OBJECT_SPECS[kind];
  const team: Team = opts.team ?? (kind === "goalkeeper" ? "A" : "N");
  let color = spec.color;
  let label = "";
  if (kind === "player") {
    color = TEAM_COLORS[team];
    label = nextPlayerNumber(opts.existing ?? [], team);
  }
  if (kind === "goalkeeper") label = "TW";
  if (kind === "coach") label = "T";
  if (kind === "text") label = "Text";
  const base: BoardObject = {
    id: newId(),
    kind,
    x,
    y,
    rotation: 0,
    color,
    label,
    team,
    size: 1,
    locked: false,
  };
  if (kind === "zone") return { ...base, width: 12, height: 8, x: x - 6, y: y - 4 };
  return base;
}

export function createPath(kind: PathKind, points: number[], partial: Partial<MovePath> = {}): MovePath {
  return {
    id: newId(),
    kind,
    points,
    color: PATH_SPECS[kind].color,
    start: 0,
    end: 1,
    easing: kind === "pass" || kind === "shot" ? "linear" : "easeInOut",
    ...partial,
  };
}

export function createTrainingSession(partial: Partial<TrainingSession> = {}): TrainingSession {
  const ts = now();
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId(),
    name: "Neue Trainingseinheit",
    date: new Date().toISOString().slice(0, 10),
    team: "",
    ageGroup: "E-Jugend",
    focus: "",
    notes: "",
    items: [],
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  };
}

/** Tiefe Kopie mit neuen IDs (für „Duplizieren“) */
export function duplicateExercise(ex: Exercise): Exercise {
  const idMap = new Map<string, string>();
  const objects = ex.objects.map((o) => {
    const id = newId();
    idMap.set(o.id, id);
    return { ...o, id };
  });
  const mapId = (id?: string) => (id ? idMap.get(id) ?? id : undefined);
  const phases = ex.phases.map((p) => ({
    ...p,
    id: newId(),
    positions: Object.fromEntries(Object.entries(p.positions).map(([k, v]) => [mapId(k) ?? k, { ...v }])),
    paths: p.paths.map((path) => ({
      ...path,
      id: newId(),
      points: [...path.points],
      objectId: mapId(path.objectId),
      carryId: mapId(path.carryId),
    })),
  }));
  const ts = now();
  return { ...ex, id: newId(), name: `${ex.name} (Kopie)`, objects, phases, createdAt: ts, updatedAt: ts };
}
