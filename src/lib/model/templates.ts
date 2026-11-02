import { createExercise, createObject, createPath, createPhase } from "./factory";
import type { BoardObject, Exercise, Phase } from "./schema";

/** Beispielübungen für den Start und als Vorlagen */

function obj(o: BoardObject, patch: Partial<BoardObject> = {}): BoardObject {
  return { ...o, ...patch };
}

export function templatePassTriangle(): Exercise {
  const cones = [createObject("cone", 12, 23.6), createObject("cone", 28, 23.6), createObject("cone", 20, 7.4)];
  const p1 = obj(createObject("player", 12, 22, { team: "A" }), { label: "1" });
  const p2 = obj(createObject("player", 28, 22, { team: "A" }), { label: "2" });
  const p3 = obj(createObject("player", 20, 9, { team: "A" }), { label: "3" });
  const ball = createObject("ball", 12.9, 22);
  const phases: Phase[] = [
    createPhase(0, {
      name: "Pass auf Position B",
      duration: 3,
      note: "Spieler 1 passt flach auf 2 und läuft dem Ball nach.",
      paths: [
        createPath("pass", [12.9, 22, 27.1, 22], { objectId: ball.id, start: 0, end: 0.45 }),
        createPath("run", [12, 22, 19, 22.6, 25.8, 23.4], { objectId: p1.id, start: 0.25, end: 1 }),
      ],
    }),
    createPhase(1, {
      name: "Pass auf Position C",
      duration: 3,
      note: "Spieler 2 nimmt offen an und spielt in den Lauf von 3.",
      paths: [
        createPath("pass", [27.1, 22, 20.6, 9.9], { objectId: ball.id, start: 0, end: 0.45 }),
        createPath("run", [28, 22, 24.5, 15, 21.6, 10.6], { objectId: p2.id, start: 0.25, end: 1 }),
      ],
    }),
  ];
  return createExercise(
    {
      name: "Passdreieck mit Nachlaufen",
      category: "Passspiel",
      ageGroup: "E-Jugend",
      playerCount: "6–9",
      durationMinutes: 12,
      material: "3 Hütchen, 2–3 Bälle",
      description: "Drei Positionen im Dreieck. Nach jedem Pass läuft der Passgeber dem Ball zur nächsten Position nach.",
      goals: "Genaues Passspiel, Ballannahme, Bewegung nach dem Abspiel.",
      coachingPoints: "Pass mit der Innenseite\nOffene Körperstellung bei der Annahme\nSofort nachlaufen",
      variations: "Richtung wechseln, nur zwei Kontakte, Doppelpass einbauen.",
      pitch: { format: "frei", stripes: true, variant: "natur" },
      objects: [...cones, p1, p2, p3, ball],
      phases,
    },
    "frei",
  );
}

export function templateSlalom(): Exercise {
  const cones = [10, 14, 18, 22, 26].map((x) => createObject("cone", x, 15));
  const p = obj(createObject("player", 6, 15, { team: "B" }), { label: "7" });
  const ball = createObject("ball", 6.8, 15);
  const goal = obj(createObject("minigoal", 37, 15), { rotation: 180 });
  const phases: Phase[] = [
    createPhase(0, {
      name: "Dribbling durch den Slalom",
      duration: 5,
      note: "Ball eng am Fuß führen, Innen- und Außenseite nutzen.",
      paths: [
        createPath("dribble", [6, 15, 10, 13, 14, 17, 18, 13, 22, 17, 26, 13, 30, 15], { objectId: p.id, carryId: ball.id }),
      ],
    }),
    createPhase(1, {
      name: "Torschuss",
      duration: 1.5,
      note: "Kurzer Blick zum Tor, flach ins Eck abschließen.",
      paths: [createPath("shot", [30.75, 15, 35.6, 14.2], { objectId: ball.id })],
    }),
  ];
  return createExercise(
    {
      name: "Dribbling-Slalom mit Abschluss",
      category: "Dribbling",
      ageGroup: "F-Jugend",
      playerCount: "4–10",
      durationMinutes: 10,
      material: "5 Hütchen, 1 Minitor, je Spieler ein Ball",
      description: "Slalom durch fünf Hütchen, danach Torschuss auf das Minitor.",
      goals: "Ballführung, Ballkontrolle bei Richtungswechseln, Abschluss.",
      coachingPoints: "Kleine Ballkontakte\nKopf hoch nach dem letzten Hütchen",
      pitch: { format: "frei", stripes: true, variant: "natur" },
      objects: [...cones, goal, p, ball],
      phases,
    },
    "frei",
  );
}

export function templateRondo(): Exercise {
  const zone = obj(createObject("zone", 20, 15), { x: 14, y: 9, width: 12, height: 12, label: "12 × 12 m" });
  const a = [
    [20, 9, "1"],
    [26, 15, "2"],
    [20, 21, "3"],
    [14, 15, "4"],
  ].map(([x, y, l]) => obj(createObject("player", x as number, y as number, { team: "A" }), { label: l as string }));
  const d = obj(createObject("player", 20, 15, { team: "B" }), { label: "1" });
  const ball = createObject("ball", 20, 9.9);
  const phases: Phase[] = [
    createPhase(0, {
      name: "Pass nach rechts",
      duration: 2.5,
      note: "Ball zirkulieren lassen, Verteidiger läuft an.",
      paths: [
        createPath("pass", [20, 9.9, 25.1, 15], { objectId: ball.id, end: 0.5 }),
        createPath("run", [20, 15, 23, 14.4], { objectId: d.id, start: 0.2 }),
      ],
    }),
    createPhase(1, {
      name: "Seitenwechsel",
      duration: 2.5,
      note: "Bei Druck schnell auf die freie Seite spielen.",
      paths: [
        createPath("pass", [25.1, 15, 20, 20.1], { objectId: ball.id, end: 0.5 }),
        createPath("run", [23, 14.4, 21, 18], { objectId: d.id, start: 0.2 }),
      ],
    }),
  ];
  return createExercise(
    {
      name: "Rondo 4 gegen 1",
      category: "Spielform",
      ageGroup: "D-Jugend",
      playerCount: "5",
      durationMinutes: 15,
      material: "4 Hütchen, Bälle, Leibchen",
      description: "Vier Außenspieler halten den Ball gegen einen Verteidiger in der Mitte. Bei Ballgewinn wird gewechselt.",
      goals: "Ballsicherung, Anbieten, schnelles Passspiel.",
      coachingPoints: "Immer zwei Anspielstationen anbieten\nMit dem richtigen Fuß annehmen",
      pitch: { format: "frei", stripes: true, variant: "natur" },
      objects: [zone, ...a, d, ball],
      phases,
    },
    "frei",
  );
}

export const TEMPLATES: { id: string; name: string; build: () => Exercise }[] = [
  { id: "pass-triangle", name: "Passdreieck mit Nachlaufen", build: templatePassTriangle },
  { id: "slalom", name: "Dribbling-Slalom mit Abschluss", build: templateSlalom },
  { id: "rondo", name: "Rondo 4 gegen 1", build: templateRondo },
];
