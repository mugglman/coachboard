"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Download, FileJson, MoreHorizontal, Pencil, Play, Plus, Search, Trash2, Upload } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { toast } from "@/components/ui/toast";
import { repository } from "@/lib/db/repository";
import { seedIfEmpty } from "@/lib/db/seed";
import { parseImport } from "@/lib/db/transfer";
import { createExercise, duplicateExercise } from "@/lib/model/factory";
import { PITCH_SPECS } from "@/lib/model/pitch";
import { TEMPLATES } from "@/lib/model/templates";
import { ageGroupSchema, categorySchema, type AgeGroup, type Exercise, type PitchFormat } from "@/lib/model/schema";
import { totalDuration } from "@/lib/animation/engine";

export default function LibraryPage() {
  const router = useRouter();
  const [items, setItems] = useState<Exercise[] | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("");
  const [age, setAge] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Exercise | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    const list = await repository.listExercises();
    setItems(list);
    // fehlende Vorschaubilder nachträglich erzeugen
    const missing = list.filter((e) => !e.thumbnail);
    if (missing.length) {
      const { renderThumbnail } = await import("@/lib/export/offscreen");
      for (const ex of missing) {
        try {
          const thumbnail = renderThumbnail(ex);
          await repository.saveExercise({ ...ex, thumbnail });
          setItems((cur) => cur?.map((c) => (c.id === ex.id ? { ...c, thumbnail } : c)) ?? cur);
        } catch (err) {
          console.warn("Vorschaubild fehlgeschlagen", err);
        }
      }
    }
  }, []);

  useEffect(() => {
    seedIfEmpty().then(reload);
  }, [reload]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter(
      (e) =>
        (!cat || e.category === cat) &&
        (!age || e.ageGroup === age) &&
        (!q || [e.name, e.description, e.tags.join(" "), e.category].join(" ").toLowerCase().includes(q)),
    );
  }, [items, query, cat, age]);

  const onImport = async (file: File) => {
    const res = parseImport(await file.text());
    if (!res.ok) return toast.error(res.error);
    for (const ex of res.data.exercises) await repository.saveExercise(ex);
    for (const s of res.data.sessions) await repository.saveSession(s);
    toast.success(`${res.data.exercises.length} Übung(en) und ${res.data.sessions.length} Einheit(en) importiert`);
    reload();
  };

  const exportAll = async () => {
    const { exportJson } = await import("@/lib/export/exporters");
    const sessions = await repository.listSessions();
    exportJson(items ?? [], sessions, `coachboard-backup-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Übungsbibliothek</h1>
            <p className="text-[13px] text-muted-fg">Übungen erstellen, animieren und für das Training exportieren.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" data-testid="import-input" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0]).finally(() => (e.target.value = ""))} />
            <Button onClick={() => fileRef.current?.click()}>
              <Upload /> Import
            </Button>
            <Button onClick={exportAll} disabled={!items?.length}>
              <Download /> Backup
            </Button>
            <Button variant="primary" onClick={() => setNewOpen(true)} data-testid="new-exercise">
              <Plus /> Neue Übung
            </Button>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2 shadow-soft">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-fg" />
            <Input placeholder="Übungen durchsuchen …" value={query} onChange={(e) => setQuery(e.target.value)} className="border-0 pl-8 focus:ring-0" aria-label="Suchen" />
          </div>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-auto" aria-label="Kategorie filtern">
            <option value="">Alle Kategorien</option>
            {categorySchema.options.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select value={age} onChange={(e) => setAge(e.target.value)} className="w-auto" aria-label="Altersklasse filtern">
            <option value="">Alle Altersklassen</option>
            {ageGroupSchema.options.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>

        {items === null ? (
          <div className="py-20 text-center text-muted-fg">Lade Übungen …</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="mb-3 text-muted-fg">{items.length ? "Keine Übung passt zum Filter." : "Noch keine Übungen vorhanden."}</p>
            <Button variant="primary" onClick={() => setNewOpen(true)}>
              <Plus /> Erste Übung anlegen
            </Button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="exercise-grid">
            {filtered.map((ex) => (
              <li key={ex.id} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lg">
                <Link href={`/editor?id=${ex.id}`} className="block aspect-[16/10] overflow-hidden bg-[#2f7a3d]">
                  {ex.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ex.thumbnail} alt={`Vorschau ${ex.name}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[12px] text-white/70">Vorschau wird erstellt …</div>
                  )}
                </Link>
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/editor?id=${ex.id}`} className="line-clamp-1 text-[14px] font-semibold hover:text-accent">
                      {ex.name}
                    </Link>
                    <Dropdown>
                      <DropdownTrigger asChild>
                        <button type="button" className="-mr-1 rounded-md p-1 text-muted-fg hover:bg-hover" aria-label={`Aktionen für ${ex.name}`}>
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownTrigger>
                      <DropdownContent>
                        <DropdownItem onSelect={() => router.push(`/editor?id=${ex.id}`)}>
                          <Pencil /> Bearbeiten
                        </DropdownItem>
                        <DropdownItem onSelect={() => router.push(`/play?id=${ex.id}`)}>
                          <Play /> Abspielen
                        </DropdownItem>
                        <DropdownItem
                          onSelect={async () => {
                            await repository.saveExercise(duplicateExercise(ex));
                            toast.success("Übung dupliziert");
                            reload();
                          }}
                        >
                          <Copy /> Duplizieren
                        </DropdownItem>
                        <DropdownItem
                          onSelect={async () => {
                            const { exportJson } = await import("@/lib/export/exporters");
                            exportJson([ex], [], ex.name);
                          }}
                        >
                          <FileJson /> Als JSON exportieren
                        </DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem className="text-danger [&_svg]:text-danger" onSelect={() => setToDelete(ex)}>
                          <Trash2 /> Löschen
                        </DropdownItem>
                      </DropdownContent>
                    </Dropdown>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge>{ex.category}</Badge>
                    <Badge>{ex.ageGroup}</Badge>
                    <Badge>{ex.durationMinutes} Min.</Badge>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-fg">
                    <span>
                      {ex.phases.length} {ex.phases.length === 1 ? "Schritt" : "Schritte"} · {totalDuration(ex).toFixed(1)} s Animation
                    </span>
                    <span>{new Date(ex.updatedAt).toLocaleDateString("de-DE")}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <NewExerciseDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreate={async (ex) => {
          await repository.saveExercise(ex);
          router.push(`/editor?id=${ex.id}`);
        }}
      />

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent title="Übung löschen?" description={`„${toDelete?.name}“ wird dauerhaft gelöscht und aus allen Trainingseinheiten entfernt.`}>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setToDelete(null)}>Abbrechen</Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!toDelete) return;
                await repository.deleteExercise(toDelete.id);
                setToDelete(null);
                toast.success("Übung gelöscht");
                reload();
              }}
            >
              <Trash2 /> Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewExerciseDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; onCreate: (ex: Exercise) => void }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<PitchFormat>("7er");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("E-Jugend");
  const [template, setTemplate] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = TEMPLATES.find((x) => x.id === template);
    const base = t ? t.build() : createExercise({}, format);
    onCreate({ ...base, name: name.trim() || (t ? t.name : "Neue Übung"), ageGroup, pitch: t ? base.pitch : { ...base.pitch, format } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Neue Übung" description="Spielfeld wählen – alles Weitere legst du im Editor fest.">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Name">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Passen und Nachlaufen" data-testid="new-name" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Spielfeld">
              <Select value={format} onChange={(e) => setFormat(e.target.value as PitchFormat)} disabled={!!template}>
                {(Object.keys(PITCH_SPECS) as PitchFormat[]).map((f) => (
                  <option key={f} value={f}>
                    {PITCH_SPECS[f].label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Altersklasse">
              <Select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}>
                {ageGroupSchema.options.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Vorlage">
            <Select value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="">Leeres Spielfeld</option>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit" variant="primary" data-testid="create-exercise">
              <Plus /> Erstellen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
