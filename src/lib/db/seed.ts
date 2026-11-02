import { repository } from "./repository";
import { TEMPLATES } from "@/lib/model/templates";

const SEED_KEY = "coachboard-seeded-v1";

/** Legt beim allerersten Start Beispielübungen an */
export async function seedIfEmpty(): Promise<boolean> {
  try {
    if (localStorage.getItem(SEED_KEY)) return false;
    const existing = await repository.listExercises();
    localStorage.setItem(SEED_KEY, "1");
    if (existing.length > 0) return false;
    for (const t of TEMPLATES) await repository.saveExercise(t.build());
    return true;
  } catch {
    return false;
  }
}
