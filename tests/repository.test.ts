import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { CoachBoardDB } from "@/lib/db/database";
import { DexieRepository } from "@/lib/db/repository";
import { createTrainingSession, newId } from "@/lib/model/factory";
import { TEMPLATES } from "@/lib/model/templates";

describe("DexieRepository (IndexedDB)", () => {
  it("speichert, lädt und löscht Übungen inkl. Verweisen in Einheiten", async () => {
    const db = new CoachBoardDB(`test-${newId()}`);
    const repo = new DexieRepository(() => db);
    const ex = TEMPLATES[2].build();
    await repo.saveExercise(ex);
    expect((await repo.getExercise(ex.id))?.name).toBe(ex.name);

    const s = createTrainingSession({ items: [{ id: newId(), exerciseId: ex.id, durationMinutes: 10, note: "" }] });
    await repo.saveSession(s);
    await repo.deleteExercise(ex.id);
    expect(await repo.getExercise(ex.id)).toBeUndefined();
    expect((await repo.getSession(s.id))?.items).toHaveLength(0);
  });
});
