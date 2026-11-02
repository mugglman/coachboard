"use client";
import { jsPDF } from "jspdf";
import type { Exercise, TrainingSession } from "@/lib/model/schema";
import { totalDuration } from "@/lib/animation/engine";
import { downloadBlob, slugify } from "@/lib/utils";
import { buildExportFile } from "@/lib/db/transfer";
import { createOffscreenBoard } from "./offscreen";

/* ---------------- PNG ---------------- */

export async function exportPng(ex: Exercise, phaseIndex: number, width = 2400): Promise<void> {
  const board = createOffscreenBoard(ex, width);
  try {
    board.renderPhase(phaseIndex);
    const blob = await (await fetch(board.toDataURL("image/png"))).blob();
    downloadBlob(blob, `${slugify(ex.name)}-schritt-${phaseIndex + 1}.png`);
  } finally {
    board.destroy();
  }
}

/* ---------------- JSON ---------------- */

export function exportJson(exercises: Exercise[], sessions: TrainingSession[] = [], name = "coachboard-export"): void {
  const file = buildExportFile(
    exercises.map((e) => ({ ...e, thumbnail: undefined })),
    sessions,
  );
  downloadBlob(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }), `${slugify(name)}.json`);
}

/* ---------------- PDF ---------------- */

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const ACCENT: [number, number, number] = [0, 191, 166];

class PdfWriter {
  doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  y = MARGIN;

  ensure(h: number) {
    if (this.y + h > PAGE_H - MARGIN) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }
  title(text: string, sub?: string) {
    const d = this.doc;
    d.setFillColor(...ACCENT);
    d.rect(MARGIN, this.y, 4, sub ? 14 : 9, "F");
    d.setTextColor(23, 33, 47);
    d.setFont("helvetica", "bold");
    d.setFontSize(18);
    d.text(text, MARGIN + 8, this.y + 7);
    if (sub) {
      d.setFont("helvetica", "normal");
      d.setFontSize(10);
      d.setTextColor(100, 116, 139);
      d.text(sub, MARGIN + 8, this.y + 13);
    }
    this.y += sub ? 20 : 14;
  }
  heading(text: string) {
    this.ensure(12);
    const d = this.doc;
    d.setFont("helvetica", "bold");
    d.setFontSize(11);
    d.setTextColor(23, 33, 47);
    d.text(text, MARGIN, this.y + 4);
    this.y += 7;
  }
  paragraph(text: string) {
    if (!text.trim()) return;
    const d = this.doc;
    d.setFont("helvetica", "normal");
    d.setFontSize(10);
    d.setTextColor(51, 65, 85);
    const lines = d.splitTextToSize(text, PAGE_W - 2 * MARGIN) as string[];
    for (const line of lines) {
      this.ensure(5);
      d.text(line, MARGIN, this.y + 4);
      this.y += 4.8;
    }
    this.y += 2;
  }
  facts(rows: [string, string][]) {
    const d = this.doc;
    const filtered = rows.filter(([, v]) => v);
    const colW = (PAGE_W - 2 * MARGIN) / 3;
    filtered.forEach(([k, v], i) => {
      const col = i % 3;
      if (col === 0) this.ensure(12);
      const x = MARGIN + col * colW;
      d.setFont("helvetica", "bold");
      d.setFontSize(7.5);
      d.setTextColor(100, 116, 139);
      d.text(k.toUpperCase(), x, this.y + 3);
      d.setFont("helvetica", "normal");
      d.setFontSize(10);
      d.setTextColor(23, 33, 47);
      d.text(String(v).slice(0, 40), x, this.y + 8);
      if (col === 2 || i === filtered.length - 1) this.y += 12;
    });
    this.y += 2;
  }
  image(dataUrl: string, wPx: number, hPx: number, maxW = PAGE_W - 2 * MARGIN, maxH = 120) {
    const ratio = hPx / wPx;
    let w = maxW;
    let h = w * ratio;
    if (h > maxH) {
      h = maxH;
      w = h / ratio;
    }
    this.ensure(h + 4);
    this.doc.addImage(dataUrl, "JPEG", MARGIN + (PAGE_W - 2 * MARGIN - w) / 2, this.y, w, h);
    this.y += h + 4;
  }
  footer() {
    const d = this.doc;
    const n = d.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      d.setPage(i);
      d.setFont("helvetica", "normal");
      d.setFontSize(8);
      d.setTextColor(148, 163, 184);
      d.text("Erstellt mit CoachBoard", MARGIN, PAGE_H - 7);
      d.text(`Seite ${i} / ${n}`, PAGE_W - MARGIN, PAGE_H - 7, { align: "right" });
    }
  }
}

function writeExercise(pdf: PdfWriter, ex: Exercise, opts: { allPhases: boolean; durationOverride?: number; note?: string }) {
  pdf.title(ex.name, `${ex.category} · ${ex.ageGroup}`);
  pdf.facts([
    ["Dauer", `${opts.durationOverride ?? ex.durationMinutes} Min.`],
    ["Spieler", ex.playerCount],
    ["Spielfeld", ex.pitch.format],
    ["Schritte", String(ex.phases.length)],
    ["Animation", `${totalDuration(ex).toFixed(1)} s`],
    ["Material", ex.material],
  ]);
  if (opts.note) {
    pdf.heading("Hinweis zur Einheit");
    pdf.paragraph(opts.note);
  }
  const board = createOffscreenBoard(ex, 1600);
  try {
    const indices = opts.allPhases ? ex.phases.map((_, i) => i) : [ex.phases.length - 1];
    for (const i of indices) {
      board.renderPhase(i);
      const phase = ex.phases[i];
      if (opts.allPhases && ex.phases.length > 1) pdf.heading(`${i + 1}. ${phase.name}`);
      pdf.image(board.toDataURL("image/jpeg", 0.88), board.width, board.height, undefined, opts.allPhases ? 105 : 120);
      if (opts.allPhases) pdf.paragraph(phase.note);
    }
  } finally {
    board.destroy();
  }
  const sections: [string, string][] = [
    ["Beschreibung", ex.description],
    ["Ziele", ex.goals],
    ["Coachingpunkte", ex.coachingPoints],
    ["Variationen", ex.variations],
  ];
  for (const [h, t] of sections) {
    if (!t.trim()) continue;
    pdf.heading(h);
    pdf.paragraph(t);
  }
}

export function exportExercisePdf(ex: Exercise): void {
  const pdf = new PdfWriter();
  writeExercise(pdf, ex, { allPhases: true });
  pdf.footer();
  pdf.doc.save(`${slugify(ex.name)}.pdf`);
}

export function exportSessionPdf(session: TrainingSession, exercises: Map<string, Exercise>): void {
  const pdf = new PdfWriter();
  const total = session.items.reduce((s, i) => s + i.durationMinutes, 0);
  pdf.title(session.name, [session.date && new Date(session.date).toLocaleDateString("de-DE"), session.team].filter(Boolean).join(" · "));
  pdf.facts([
    ["Altersklasse", session.ageGroup],
    ["Gesamtdauer", `${total} Min.`],
    ["Übungen", String(session.items.length)],
    ["Schwerpunkt", session.focus],
  ]);
  if (session.notes) {
    pdf.heading("Notizen");
    pdf.paragraph(session.notes);
  }
  pdf.heading("Ablauf");
  let t = 0;
  session.items.forEach((item, idx) => {
    const ex = exercises.get(item.exerciseId);
    pdf.paragraph(`${idx + 1}.  ${String(t).padStart(3, " ")}–${t + item.durationMinutes} Min.   ${ex?.name ?? "(gelöschte Übung)"}`);
    t += item.durationMinutes;
  });
  for (const item of session.items) {
    const ex = exercises.get(item.exerciseId);
    if (!ex) continue;
    pdf.doc.addPage();
    pdf.y = MARGIN;
    writeExercise(pdf, ex, { allPhases: false, durationOverride: item.durationMinutes, note: item.note });
  }
  pdf.footer();
  pdf.doc.save(`${slugify(session.name)}.pdf`);
}
