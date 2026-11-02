import type { PitchFormat } from "./schema";

export interface PitchSpec {
  label: string;
  /** Länge (x-Richtung) in Metern */
  length: number;
  /** Breite (y-Richtung) in Metern */
  width: number;
  penaltyDepth: number;
  penaltyWidth: number;
  goalAreaDepth: number;
  goalAreaWidth: number;
  centerRadius: number;
  penaltySpot: number;
  goalWidth: number;
  goalDepth: number;
  /** halb = nur eine Hälfte mit Tor rechts */
  half: boolean;
  /** frei = Trainingsfläche ohne Markierungen */
  markings: boolean;
}

/**
 * Maße orientieren sich an üblichen DFB-Empfehlungen für den Kinder- und
 * Jugendfußball (gerundete Mittelwerte), 11er nach FIFA-Standard.
 */
export const PITCH_SPECS: Record<PitchFormat, PitchSpec> = {
  "11er": {
    label: "Großfeld 11 gegen 11",
    length: 105,
    width: 68,
    penaltyDepth: 16.5,
    penaltyWidth: 40.32,
    goalAreaDepth: 5.5,
    goalAreaWidth: 18.32,
    centerRadius: 9.15,
    penaltySpot: 11,
    goalWidth: 7.32,
    goalDepth: 2,
    half: false,
    markings: true,
  },
  "9er": {
    label: "D-Jugend 9 gegen 9",
    length: 64,
    width: 48,
    penaltyDepth: 13,
    penaltyWidth: 30,
    goalAreaDepth: 4,
    goalAreaWidth: 14,
    centerRadius: 7,
    penaltySpot: 9,
    goalWidth: 5,
    goalDepth: 1.6,
    half: false,
    markings: true,
  },
  "7er": {
    label: "E-Jugend 7 gegen 7",
    length: 55,
    width: 35,
    penaltyDepth: 10,
    penaltyWidth: 25,
    goalAreaDepth: 0,
    goalAreaWidth: 0,
    centerRadius: 6,
    penaltySpot: 8,
    goalWidth: 5,
    goalDepth: 1.4,
    half: false,
    markings: true,
  },
  "5er": {
    label: "F-Jugend 5 gegen 5",
    length: 35,
    width: 25,
    penaltyDepth: 6,
    penaltyWidth: 14,
    goalAreaDepth: 0,
    goalAreaWidth: 0,
    centerRadius: 4,
    penaltySpot: 6,
    goalWidth: 3,
    goalDepth: 1,
    half: false,
    markings: true,
  },
  halb: {
    label: "Halbes Großfeld",
    length: 52.5,
    width: 68,
    penaltyDepth: 16.5,
    penaltyWidth: 40.32,
    goalAreaDepth: 5.5,
    goalAreaWidth: 18.32,
    centerRadius: 9.15,
    penaltySpot: 11,
    goalWidth: 7.32,
    goalDepth: 2,
    half: true,
    markings: true,
  },
  frei: {
    label: "Freie Trainingsfläche",
    length: 40,
    width: 30,
    penaltyDepth: 0,
    penaltyWidth: 0,
    goalAreaDepth: 0,
    goalAreaWidth: 0,
    centerRadius: 0,
    penaltySpot: 0,
    goalWidth: 0,
    goalDepth: 0,
    half: false,
    markings: false,
  },
};

/** Rand um das Spielfeld (Meter), damit Tore und Material außerhalb Platz haben */
export const PITCH_MARGIN = 4;

export function boardSize(format: PitchFormat): { w: number; h: number } {
  const s = PITCH_SPECS[format];
  return { w: s.length + PITCH_MARGIN * 2, h: s.width + PITCH_MARGIN * 2 };
}
