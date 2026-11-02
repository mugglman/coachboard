import Dexie, { type Table } from "dexie";
import type { Exercise, TrainingSession } from "@/lib/model/schema";

/**
 * Lokale IndexedDB-Datenbank. Die Struktur entspricht 1:1 den späteren
 * Tabellen in PostgreSQL (exercises, sessions), damit ein Backend später
 * über das Repository-Interface ergänzt werden kann.
 */
export class CoachBoardDB extends Dexie {
  exercises!: Table<Exercise, string>;
  sessions!: Table<TrainingSession, string>;

  constructor(name = "coachboard") {
    super(name);
    this.version(1).stores({
      exercises: "id, name, category, ageGroup, updatedAt",
      sessions: "id, name, date, updatedAt",
    });
  }
}

let instance: CoachBoardDB | null = null;
export function getDB(): CoachBoardDB {
  if (!instance) instance = new CoachBoardDB();
  return instance;
}
