import { exerciseSchema, trainingSessionSchema, type Exercise, type TrainingSession } from "@/lib/model/schema";
import { getDB, type CoachBoardDB } from "./database";

/**
 * Repository-Schnittstelle: Die UI spricht nur mit diesem Interface.
 * Für ein späteres Backend (REST + PostgreSQL) wird lediglich eine weitere
 * Implementierung (z. B. ApiRepository) ergänzt.
 */
export interface Repository {
  listExercises(): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise | undefined>;
  saveExercise(ex: Exercise): Promise<void>;
  deleteExercise(id: string): Promise<void>;
  listSessions(): Promise<TrainingSession[]>;
  getSession(id: string): Promise<TrainingSession | undefined>;
  saveSession(s: TrainingSession): Promise<void>;
  deleteSession(id: string): Promise<void>;
}

export class DexieRepository implements Repository {
  constructor(private readonly dbFactory: () => CoachBoardDB = getDB) {}
  private get db() {
    return this.dbFactory();
  }

  async listExercises() {
    const all = await this.db.exercises.toArray();
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  async getExercise(id: string) {
    const raw = await this.db.exercises.get(id);
    if (!raw) return undefined;
    const parsed = exerciseSchema.safeParse(raw);
    return parsed.success ? parsed.data : raw;
  }
  async saveExercise(ex: Exercise) {
    await this.db.exercises.put(exerciseSchema.parse(ex));
  }
  async deleteExercise(id: string) {
    await this.db.transaction("rw", this.db.exercises, this.db.sessions, async () => {
      await this.db.exercises.delete(id);
      // Verweise in Trainingseinheiten entfernen
      const sessions = await this.db.sessions.toArray();
      for (const s of sessions) {
        if (s.items.some((i) => i.exerciseId === id)) {
          await this.db.sessions.put({ ...s, items: s.items.filter((i) => i.exerciseId !== id) });
        }
      }
    });
  }
  async listSessions() {
    const all = await this.db.sessions.toArray();
    return all.sort((a, b) => (b.date || b.updatedAt).localeCompare(a.date || a.updatedAt));
  }
  async getSession(id: string) {
    return this.db.sessions.get(id);
  }
  async saveSession(s: TrainingSession) {
    await this.db.sessions.put(trainingSessionSchema.parse(s));
  }
  async deleteSession(id: string) {
    await this.db.sessions.delete(id);
  }
}

export const repository: Repository = new DexieRepository();
