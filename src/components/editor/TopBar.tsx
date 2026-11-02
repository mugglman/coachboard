"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  CloudOff,
  Download,
  FileJson,
  FileText,
  Image as ImageIcon,
  Loader2,
  Maximize,
  Redo2,
  Smartphone,
  Undo2,
  Video,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEditor } from "@/store/editorStore";
import { Button } from "@/components/ui/button";
import { Tip } from "@/components/ui/tooltip";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { toast } from "@/components/ui/toast";
import { exportExercisePdf, exportJson, exportPng } from "@/lib/export/exporters";
import { VideoExportDialog } from "./VideoExportDialog";

function SaveIndicator() {
  const status = useEditor((s) => s.saveStatus);
  const map = {
    saved: { icon: <Check className="size-3.5" />, text: "Gespeichert", cls: "text-muted-fg" },
    saving: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "Speichert …", cls: "text-muted-fg" },
    dirty: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "Änderungen …", cls: "text-muted-fg" },
    error: { icon: <CloudOff className="size-3.5" />, text: "Speichern fehlgeschlagen", cls: "text-danger" },
  }[status];
  return (
    <span className={`hidden items-center gap-1 text-[12px] md:flex ${map.cls}`} data-testid="save-status" data-status={status}>
      {map.icon}
      {map.text}
    </span>
  );
}

export function TopBar() {
  const ex = useEditor((s) => s.exercise);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const zoom = useEditor((s) => s.zoom);
  const phaseIndex = useEditor((s) => s.phaseIndex);
  const st = useEditor.getState;
  const [videoOpen, setVideoOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!ex) return null;

  const run = async (label: string, fn: () => Promise<void> | void) => {
    setBusy(true);
    try {
      await fn();
      toast.success(`${label} erstellt`);
    } catch (e) {
      console.error(e);
      toast.error(`${label} fehlgeschlagen: ${e instanceof Error ? e.message : "Unbekannter Fehler"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-sidebar px-3">
      <Tip label="Zur Bibliothek">
        <Link href="/" className="flex size-8 items-center justify-center rounded-lg text-muted-fg hover:bg-hover" aria-label="Zur Bibliothek">
          <ArrowLeft className="size-4" />
        </Link>
      </Tip>
      <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-[13px] font-black text-accent-fg">CB</div>
      <input
        key={ex.name}
        aria-label="Name der Übung"
        data-testid="exercise-name"
        defaultValue={ex.name}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v && v !== ex.name) st().update((d) => void (d.name = v));
          else e.target.value = ex.name;
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="h-8 min-w-0 max-w-[280px] flex-1 rounded-lg border border-transparent bg-transparent px-2 text-[14px] font-semibold hover:border-border focus:border-accent focus:outline-none"
      />
      <SaveIndicator />

      <div className="mx-2 hidden h-6 w-px bg-border md:block" />
      <Tip label="Rückgängig (Strg+Z)">
        <Button size="icon" variant="ghost" aria-label="Rückgängig" disabled={!canUndo} onClick={() => st().undo()}>
          <Undo2 />
        </Button>
      </Tip>
      <Tip label="Wiederholen (Strg+Y)">
        <Button size="icon" variant="ghost" aria-label="Wiederholen" disabled={!canRedo} onClick={() => st().redo()}>
          <Redo2 />
        </Button>
      </Tip>

      <div className="ml-auto flex items-center gap-1">
        <div className="hidden items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 lg:flex">
          <Button size="iconSm" variant="ghost" aria-label="Verkleinern" onClick={() => st().setZoom(zoom / 1.2)}>
            <ZoomOut />
          </Button>
          <span className="w-11 text-center text-[12px] tabular-nums text-muted-fg">{Math.round(zoom * 100)} %</span>
          <Button size="iconSm" variant="ghost" aria-label="Vergrößern" onClick={() => st().setZoom(zoom * 1.2)}>
            <ZoomIn />
          </Button>
          <Tip label="Spielfeld einpassen (F)">
            <Button size="iconSm" variant="ghost" aria-label="Einpassen" onClick={() => st().requestFit()}>
              <Maximize />
            </Button>
          </Tip>
        </div>
        <ThemeToggle />
        <Tip label="Abspielansicht (Smartphone)">
          <Link href={`/play?id=${ex.id}`} className="flex size-8 items-center justify-center rounded-lg text-fg hover:bg-hover" aria-label="Abspielansicht öffnen">
            <Smartphone className="size-4" />
          </Link>
        </Tip>
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="primary" disabled={busy} data-testid="export-menu">
              {busy ? <Loader2 className="animate-spin" /> : <Download />}
              <span className="hidden sm:inline">Export</span>
            </Button>
          </DropdownTrigger>
          <DropdownContent>
            <DropdownLabel>Exportieren</DropdownLabel>
            <DropdownItem onSelect={() => run("Bild", () => exportPng(ex, phaseIndex))}>
              <ImageIcon /> Bild (PNG) – aktueller Schritt
            </DropdownItem>
            <DropdownItem onSelect={() => run("PDF", () => exportExercisePdf(ex))}>
              <FileText /> PDF – alle Schritte
            </DropdownItem>
            <DropdownItem onSelect={() => setVideoOpen(true)}>
              <Video /> Video (MP4 / WebM)
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem onSelect={() => run("JSON-Datei", () => exportJson([ex], [], ex.name))}>
              <FileJson /> Übung als JSON
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
      <VideoExportDialog open={videoOpen} onOpenChange={setVideoOpen} exercise={ex} />
    </header>
  );
}
