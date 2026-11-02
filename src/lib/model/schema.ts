import { z } from "zod";

/**
 * Zentrales Datenmodell von CoachBoard.
 * Alle Koordinaten werden in METERN im Spielfeld-Koordinatensystem gespeichert
 * (Ursprung = linke obere Ecke der Spielfläche). Damit ist das Modell
 * unabhängig von Bildschirmgröße, Zoom und Exportauflösung.
 */

export const SCHEMA_VERSION = 1;

export const pitchFormatSchema = z.enum(["11er", "9er", "7er", "5er", "halb", "frei"]);
export type PitchFormat = z.infer<typeof pitchFormatSchema>;

export const pitchSchema = z.object({
  format: pitchFormatSchema,
  stripes: z.boolean(),
  variant: z.enum(["natur", "dunkel"]),
});
export type PitchConfig = z.infer<typeof pitchSchema>;

export const objectKindSchema = z.enum([
  "player",
  "goalkeeper",
  "coach",
  "ball",
  "cone",
  "marker",
  "pole",
  "hurdle",
  "ring",
  "minigoal",
  "goal",
  "ladder",
  "mannequin",
  "text",
  "zone",
]);
export type ObjectKind = z.infer<typeof objectKindSchema>;

export const teamSchema = z.enum(["A", "B", "N"]);
export type Team = z.infer<typeof teamSchema>;

export const boardObjectSchema = z.object({
  id: z.string().min(1),
  kind: objectKindSchema,
  /** Startposition (Schritt 1) in Metern */
  x: z.number(),
  y: z.number(),
  rotation: z.number().default(0),
  color: z.string(),
  label: z.string().default(""),
  team: teamSchema.default("N"),
  /** Größenfaktor (1 = Standard) */
  size: z.number().positive().default(1),
  /** Nur für Zonen: Breite/Höhe in Metern */
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  locked: z.boolean().default(false),
});
export type BoardObject = z.infer<typeof boardObjectSchema>;

export const pathKindSchema = z.enum(["run", "pass", "dribble", "shot"]);
export type PathKind = z.infer<typeof pathKindSchema>;

export const pathSchema = z.object({
  id: z.string().min(1),
  kind: pathKindSchema,
  /** Flaches Punktarray [x0, y0, x1, y1, ...] in Metern */
  points: z.array(z.number()).min(4),
  color: z.string(),
  /** Objekt, das sich entlang des Weges bewegt (Spieler oder Ball) */
  objectId: z.string().optional(),
  /** Zweites Objekt, das mitgeführt wird (Ball beim Dribbling) */
  carryId: z.string().optional(),
  /** Zeitfenster innerhalb des Schritts, 0..1 */
  start: z.number().min(0).max(1).default(0),
  end: z.number().min(0).max(1).default(1),
  easing: z.enum(["linear", "easeInOut"]).default("easeInOut"),
});
export type MovePath = z.infer<typeof pathSchema>;

export const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
  rotation: z.number().optional(),
});
export type Position = z.infer<typeof positionSchema>;

export const phaseSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  /** Dauer der Animation in Sekunden */
  duration: z.number().min(0.2).max(60),
  note: z.string().default(""),
  /** Positionsänderungen gegenüber dem vorherigen Schritt */
  positions: z.record(z.string(), positionSchema).default({}),
  paths: z.array(pathSchema).default([]),
});
export type Phase = z.infer<typeof phaseSchema>;

export const ageGroupSchema = z.enum(["F-Jugend", "E-Jugend", "D-Jugend", "C-Jugend", "B-Jugend", "A-Jugend", "Senioren", "Alle"]);
export type AgeGroup = z.infer<typeof ageGroupSchema>;

export const categorySchema = z.enum([
  "Aufwärmen",
  "Passspiel",
  "Dribbling",
  "Torschuss",
  "Koordination",
  "Spielform",
  "Taktik",
  "Torwart",
  "Abschluss",
]);
export type Category = z.infer<typeof categorySchema>;

export const exerciseSchema = z.object({
  schemaVersion: z.number().int().default(SCHEMA_VERSION),
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().default(""),
  category: categorySchema.default("Passspiel"),
  ageGroup: ageGroupSchema.default("E-Jugend"),
  playerCount: z.string().default(""),
  durationMinutes: z.number().int().min(0).max(240).default(15),
  material: z.string().default(""),
  goals: z.string().default(""),
  coachingPoints: z.string().default(""),
  variations: z.string().default(""),
  tags: z.array(z.string()).default([]),
  pitch: pitchSchema,
  objects: z.array(boardObjectSchema),
  phases: z.array(phaseSchema).min(1),
  thumbnail: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Exercise = z.infer<typeof exerciseSchema>;

export const sessionItemSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  durationMinutes: z.number().int().min(0).max(240),
  note: z.string().default(""),
});
export type SessionItem = z.infer<typeof sessionItemSchema>;

export const trainingSessionSchema = z.object({
  schemaVersion: z.number().int().default(SCHEMA_VERSION),
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  date: z.string().default(""),
  team: z.string().default(""),
  ageGroup: ageGroupSchema.default("E-Jugend"),
  focus: z.string().default(""),
  notes: z.string().default(""),
  items: z.array(sessionItemSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TrainingSession = z.infer<typeof trainingSessionSchema>;

/** Exportformat für JSON-Dateien (Übungen + optional Einheiten) */
export const exportFileSchema = z.object({
  app: z.literal("coachboard"),
  version: z.number().int(),
  exportedAt: z.string(),
  exercises: z.array(exerciseSchema).default([]),
  sessions: z.array(trainingSessionSchema).default([]),
});
export type ExportFile = z.infer<typeof exportFileSchema>;
