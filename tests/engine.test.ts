import { describe, expect, it } from "vitest";
import { createExercise, createObject, createPath, createPhase } from "@/lib/model/factory";
import { CARRY_OFFSET, editFrame, frameAt, phaseStates, totalDuration } from "@/lib/animation/engine";

function setup() {
  const p = createObject("player", 0, 0, { team: "A" });
  const ball = createObject("ball", 0.5, 0);
  const cone = createObject("cone", 5, 5);
  const ex = createExercise({
    objects: [p, ball, cone],
    phases: [
      createPhase(0, {
        duration: 2,
        paths: [createPath("run", [0, 0, 10, 0], { objectId: p.id, easing: "linear" })],
      }),
      createPhase(1, { duration: 4, positions: { [p.id]: { x: 10, y: 10 } } }),
    ],
  });
  return { ex, p, ball, cone };
}

describe("Animationsengine", () => {
  it("summiert die Gesamtdauer", () => {
    expect(totalDuration(setup().ex)).toBe(6);
  });

  it("verwendet Wegende als Endzustand eines Schritts", () => {
    const { ex, p } = setup();
    const s = phaseStates(ex);
    expect(s.before[0][p.id]).toMatchObject({ x: 0, y: 0 });
    expect(s.after[0][p.id]).toMatchObject({ x: 10, y: 0 });
    expect(s.after[1][p.id]).toMatchObject({ x: 10, y: 10 });
  });

  it("bewegt Spieler entlang des Weges (linear)", () => {
    const { ex, p } = setup();
    expect(frameAt(ex, 1).poses[p.id].x).toBeCloseTo(5);
    expect(frameAt(ex, 1).phaseIndex).toBe(0);
  });

  it("interpoliert Positionsänderungen ohne Weg weich", () => {
    const { ex, p } = setup();
    const mid = frameAt(ex, 4).poses[p.id];
    expect(mid.x).toBeCloseTo(10);
    expect(mid.y).toBeCloseTo(5);
    expect(frameAt(ex, 6).poses[p.id].y).toBeCloseTo(10);
  });

  it("respektiert Start/Ende-Zeitfenster eines Weges", () => {
    const { ex, p } = setup();
    ex.phases[0].paths[0].start = 0.5;
    expect(frameAt(ex, 0.9).poses[p.id].x).toBeCloseTo(0);
    expect(frameAt(ex, 2).poses[p.id].x).toBeCloseTo(10);
  });

  it("führt beim Dribbling den Ball mit", () => {
    const { ex, p, ball } = setup();
    ex.phases[0].paths[0] = createPath("dribble", [0, 0, 10, 0], { objectId: p.id, carryId: ball.id, easing: "linear" });
    const s = phaseStates(ex);
    expect(s.after[0][ball.id].x).toBeCloseTo(10 + CARRY_OFFSET);
    const f = frameAt(ex, 1);
    expect(f.poses[ball.id].x).toBeCloseTo(5 + CARRY_OFFSET);
  });

  it("Material bleibt unverändert", () => {
    const { ex, cone } = setup();
    expect(frameAt(ex, 3).poses[cone.id]).toMatchObject({ x: 5, y: 5 });
  });

  it("Editor-Frame zeigt Endzustand", () => {
    const { ex, p } = setup();
    const f = editFrame(ex, 0);
    expect(f.poses[p.id].x).toBeCloseTo(10);
    expect(f.pathProgress[ex.phases[0].paths[0].id]).toBe(1);
  });
});
