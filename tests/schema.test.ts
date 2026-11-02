import { describe, expect, it } from "vitest";
import { exerciseSchema } from "@/lib/model/schema";
import { duplicateExercise } from "@/lib/model/factory";
import { buildExportFile, parseImport } from "@/lib/db/transfer";
import { TEMPLATES } from "@/lib/model/templates";

describe("Datenmodell und JSON-Transfer", () => {
  it("Vorlagen sind gültig", () => {
    for (const t of TEMPLATES) expect(exerciseSchema.safeParse(t.build()).success).toBe(true);
  });

  it("Export und Import ergeben dieselben Daten", () => {
    const ex = TEMPLATES[0].build();
    const json = JSON.stringify(buildExportFile([ex]));
    const res = parseImport(json);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.exercises[0]).toEqual(ex);
  });

  it("akzeptiert einzelne Übung als JSON", () => {
    const ex = TEMPLATES[1].build();
    const res = parseImport(JSON.stringify(ex));
    expect(res.ok).toBe(true);
  });

  it("lehnt ungültige Dateien mit Meldung ab", () => {
    expect(parseImport("kein json")).toMatchObject({ ok: false });
    const res = parseImport(JSON.stringify({ app: "coachboard", version: 1, exportedAt: "x", exercises: [{ id: 1 }] }));
    expect(res.ok).toBe(false);
  });

  it("Duplikat erhält neue IDs und konsistente Verweise", () => {
    const ex = TEMPLATES[1].build();
    const dup = duplicateExercise(ex);
    expect(dup.id).not.toBe(ex.id);
    const ids = new Set(dup.objects.map((o) => o.id));
    for (const o of ex.objects) expect(ids.has(o.id)).toBe(false);
    for (const p of dup.phases) for (const path of p.paths) if (path.objectId) expect(ids.has(path.objectId)).toBe(true);
  });
});
