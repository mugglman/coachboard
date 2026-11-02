import { exportFileSchema, SCHEMA_VERSION, type Exercise, type ExportFile, type TrainingSession } from "@/lib/model/schema";
import { newId } from "@/lib/model/factory";

export function buildExportFile(exercises: Exercise[], sessions: TrainingSession[] = []): ExportFile {
  return {
    app: "coachboard",
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    exercises,
    sessions,
  };
}

export type ImportResult =
  | { ok: true; data: ExportFile }
  | { ok: false; error: string };

/** Validiert eine importierte JSON-Datei. Akzeptiert auch eine einzelne Übung. */
export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "Die Datei ist kein gültiges JSON." };
  }
  const candidate =
    raw && typeof raw === "object" && !("app" in raw) && "phases" in raw
      ? { app: "coachboard", version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), exercises: [raw] }
      : raw;
  const parsed = exportFileSchema.safeParse(candidate);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `Ungültiges CoachBoard-Format (${issue?.path.join(".") || "Wurzel"}: ${issue?.message ?? "unbekannt"})` };
  }
  return { ok: true, data: parsed.data };
}

/** Vergibt neue IDs, falls bereits vorhandene Einträge überschrieben würden */
export function withFreshIds<T extends { id: string }>(items: T[], existing: Set<string>): T[] {
  return items.map((it) => (existing.has(it.id) ? { ...it, id: newId() } : it));
}
