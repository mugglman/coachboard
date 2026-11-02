import { beforeEach, describe, expect, it } from "vitest";
import { useEditor } from "@/store/editorStore";
import { createExercise } from "@/lib/model/factory";
import { phaseStates } from "@/lib/animation/engine";

const st = () => useEditor.getState();

describe("Editor-Store", () => {
  beforeEach(() => st().load(createExercise({}, "7er")));

  it("platziert Objekte mit fortlaufenden Nummern", () => {
    st().addObject("player", 5, 5, "A");
    st().addObject("player", 8, 5, "A");
    const labels = st().exercise!.objects.map((o) => o.label);
    expect(labels).toEqual(["1", "2"]);
    expect(st().saveStatus).toBe("dirty");
  });

  it("Undo und Redo", () => {
    st().addObject("cone", 1, 1);
    expect(st().exercise!.objects).toHaveLength(1);
    st().undo();
    expect(st().exercise!.objects).toHaveLength(0);
    st().redo();
    expect(st().exercise!.objects).toHaveLength(1);
  });

  it("verknüpft Laufweg mit nahem Spieler und setzt Endposition", () => {
    const id = st().addObject("player", 10, 10, "A");
    const pathId = st().addPath("run", [
      { x: 10.5, y: 10.3 },
      { x: 15, y: 12 },
      { x: 20, y: 10 },
    ]);
    expect(pathId).toBeTruthy();
    const path = st().exercise!.phases[0].paths[0];
    expect(path.objectId).toBe(id);
    expect(path.points.slice(0, 2)).toEqual([10, 10]);
    expect(phaseStates(st().exercise!).after[0][id]).toMatchObject({ x: 20, y: 10 });
  });

  it("verknüpft Dribbling mit Spieler und Ball", () => {
    const pid = st().addObject("player", 10, 10, "A");
    const bid = st().addObject("ball", 10.8, 10);
    st().addPath("dribble", [
      { x: 10, y: 10 },
      { x: 20, y: 10 },
    ]);
    const path = st().exercise!.phases[0].paths[0];
    expect(path.objectId).toBe(pid);
    expect(path.carryId).toBe(bid);
  });

  it("verschiebt Spieler in späteren Schritten als Keyframe", () => {
    const id = st().addObject("player", 10, 10, "A");
    st().addPhase();
    expect(st().phaseIndex).toBe(1);
    st().moveObject(id, 20, 20);
    const ex = st().exercise!;
    expect(ex.objects[0]).toMatchObject({ x: 10, y: 10 });
    expect(ex.phases[1].positions[id]).toMatchObject({ x: 20, y: 20 });
  });

  it("verschiebt Material in allen Schritten", () => {
    const id = st().addObject("cone", 3, 3);
    st().addPhase();
    st().moveObject(id, 6, 6);
    expect(st().exercise!.objects[0]).toMatchObject({ x: 6, y: 6 });
    expect(st().exercise!.phases[1].positions[id]).toBeUndefined();
  });

  it("löscht Objekt und entfernt Verknüpfungen", () => {
    const id = st().addObject("player", 10, 10, "A");
    st().addPath("run", [
      { x: 10, y: 10 },
      { x: 20, y: 10 },
    ]);
    st().select({ type: "object", id });
    st().deleteSelection();
    const ex = st().exercise!;
    expect(ex.objects).toHaveLength(0);
    expect(ex.phases[0].paths[0].objectId).toBeUndefined();
  });

  it("dupliziert und löscht Schritte", () => {
    st().addObject("player", 1, 1, "A");
    st().duplicatePhase(0);
    expect(st().exercise!.phases).toHaveLength(2);
    st().deletePhase(1);
    expect(st().exercise!.phases).toHaveLength(1);
    st().deletePhase(0);
    expect(st().exercise!.phases).toHaveLength(1);
  });
});
