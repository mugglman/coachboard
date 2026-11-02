import { repository } from "./repository";
import { TEMPLATES } from "@/lib/model/templates";

const SEED_KEY = "coachboard-seeded-v1";

// Laufender Seed-Vorgang: verhindert doppelte Beispielübungen, wenn der
// Effekt (React StrictMode / schnelles Neuladen) mehrfach parallel feuert.
let pending: Promise<boolean> | null = null;

/** Legt beim allerersten Start Beispielübungen an */
export function seedIfEmpty(): Promise<boolean> {
  pending ??= runSeed();
  return pending;
}

async function runSeed(): Promise<boolean> {
  try {
    if (localStorage.getItem(SEED_KEY)) return false;
    localStorage.setItem(SEED_KEY, "1");
    const existing = await repository.listExercises();
    if (existing.length > 0) return false;
    for (const t of TEMPLATES) await repository.saveExercise(t.build());
    return true;
  } catch {
    return false;
  }
}
