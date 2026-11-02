import { describe, expect, it } from "vitest";
import { pointAt, polylineLength, simplify, slicePath, smoothPath, toPoints, wavePath } from "@/lib/geometry/path";

describe("Geometrie", () => {
  it("berechnet Länge einer Polylinie", () => {
    expect(polylineLength(toPoints([0, 0, 3, 4, 3, 10]))).toBeCloseTo(11);
  });

  it("liefert Punkte entlang der Bahn", () => {
    const pts = toPoints([0, 0, 10, 0]);
    expect(pointAt(pts, 0)).toMatchObject({ x: 0, y: 0 });
    expect(pointAt(pts, 0.5).x).toBeCloseTo(5);
    expect(pointAt(pts, 1)).toMatchObject({ x: 10, y: 0 });
    expect(pointAt(pts, 2).x).toBeCloseTo(10);
  });

  it("vereinfacht nahezu gerade Freihandlinien", () => {
    const pts = Array.from({ length: 50 }, (_, i) => ({ x: i, y: (i % 2) * 0.01 }));
    const s = simplify(pts, 0.2);
    expect(s.length).toBe(2);
    expect(s[0]).toEqual(pts[0]);
    expect(s[1]).toEqual(pts[49]);
  });

  it("glättet und behält Start- und Endpunkt", () => {
    const pts = toPoints([0, 0, 5, 5, 10, 0]);
    const sm = smoothPath(pts, 8);
    expect(sm[0]).toEqual(pts[0]);
    expect(sm[sm.length - 1].x).toBeCloseTo(10);
    expect(sm[sm.length - 1].y).toBeCloseTo(0);
    expect(sm.length).toBe(17);
  });

  it("schneidet Teilstücke ab", () => {
    const sl = slicePath(toPoints([0, 0, 10, 0]), 0.3);
    expect(sl[sl.length - 1].x).toBeCloseTo(3);
  });

  it("Wellenlinie endet am Zielpunkt", () => {
    const w = wavePath(toPoints([0, 0, 20, 0]), 0.3, 1.5);
    expect(w[w.length - 1].x).toBeCloseTo(20);
    expect(w[w.length - 1].y).toBeCloseTo(0);
    expect(Math.max(...w.map((p) => Math.abs(p.y)))).toBeGreaterThan(0.2);
  });
});
