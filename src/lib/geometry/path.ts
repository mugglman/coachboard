/**
 * Geometrie-Hilfen für Wege. Gezeichnete Linie und Animation nutzen exakt
 * dieselbe Abtastung, damit Spieler sich genau auf der sichtbaren Linie bewegen.
 */

export interface Pt {
  x: number;
  y: number;
}

export function toPoints(flat: number[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) out.push({ x: flat[i], y: flat[i + 1] });
  return out;
}

export function toFlat(pts: Pt[]): number[] {
  const out: number[] = [];
  for (const p of pts) out.push(p.x, p.y);
  return out;
}

export const dist = (a: Pt, b: Pt): number => Math.hypot(b.x - a.x, b.y - a.y);

/** Ramer-Douglas-Peucker – reduziert Freihand-Punkte */
export function simplify(pts: Pt[], epsilon: number): Pt[] {
  if (pts.length < 3) return pts.slice();
  const first = pts[0];
  const last = pts[pts.length - 1];
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpendicularDistance(pts[i], first, last);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > epsilon) {
    const left = simplify(pts.slice(0, idx + 1), epsilon);
    const right = simplify(pts.slice(idx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function perpendicularDistance(p: Pt, a: Pt, b: Pt): number {
  const len = dist(a, b);
  if (len === 0) return dist(p, a);
  return Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / len;
}

/** Catmull-Rom-Spline (zentripetal vereinfacht, uniform) durch alle Stützpunkte */
export function smoothPath(pts: Pt[], segmentsPerSpan = 12): Pt[] {
  if (pts.length < 3) return pts.slice();
  const out: Pt[] = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    for (let s = 1; s <= segmentsPerSpan; s++) {
      const t = s / segmentsPerSpan;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  return out;
}

export function polylineLength(pts: Pt[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  return l;
}

/** Punkt und Richtung bei Anteil t (0..1) der Gesamtlänge */
export function pointAt(pts: Pt[], t: number): Pt & { angle: number } {
  if (pts.length === 0) return { x: 0, y: 0, angle: 0 };
  if (pts.length === 1) return { ...pts[0], angle: 0 };
  const total = polylineLength(pts);
  const clamped = Math.min(1, Math.max(0, t));
  let target = total * clamped;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = dist(a, b);
    if (target <= seg || i === pts.length - 1) {
      const f = seg === 0 ? 0 : Math.min(1, target / seg);
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    target -= seg;
  }
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  return { ...b, angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

/** Abgetastete, geglättete Bahn eines gespeicherten Weges */
export function samplePath(flat: number[]): Pt[] {
  return smoothPath(toPoints(flat));
}

/** Teilstück der Bahn von 0 bis t (für „mitwachsende“ Linien in der Animation) */
export function slicePath(pts: Pt[], t: number): Pt[] {
  if (t >= 1) return pts;
  if (t <= 0 || pts.length < 2) return pts.slice(0, 1);
  const total = polylineLength(pts);
  let target = total * t;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const seg = dist(pts[i - 1], pts[i]);
    if (target <= seg) {
      const f = seg === 0 ? 0 : target / seg;
      out.push({ x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f });
      return out;
    }
    target -= seg;
    out.push(pts[i]);
  }
  return out;
}

/** Wellenlinie entlang der Bahn (Dribbling-Darstellung) */
export function wavePath(pts: Pt[], amplitude: number, wavelength: number): Pt[] {
  const total = polylineLength(pts);
  if (total === 0) return pts.slice();
  const steps = Math.max(8, Math.ceil(total / (wavelength / 8)));
  const out: Pt[] = [];
  // Letztes Stück glatt lassen, damit die Pfeilspitze sauber sitzt
  const waveEnd = Math.max(0, 1 - (wavelength * 0.6) / total);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = pointAt(pts, t);
    const off = t < waveEnd ? Math.sin((t * total * 2 * Math.PI) / wavelength) * amplitude : 0;
    out.push({ x: p.x - Math.sin(p.angle) * off, y: p.y + Math.cos(p.angle) * off });
  }
  return out;
}

export function nearestIndex<T extends Pt>(items: T[], p: Pt, maxDist: number): number {
  let best = -1;
  let bestD = maxDist;
  items.forEach((it, i) => {
    const d = dist(it, p);
    if (d <= bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}
