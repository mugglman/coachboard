"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, CalendarDays, Clock, FileJson, FileText, Loader2, Play, Plus, Search, Trash2, X } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { repository } from "@/lib/db/repository";
import { createTrainingSession, newId } from "@/lib/model/factory";
import { ageGroupSchema, type AgeGroup, type Exercise, type TrainingSession } from "@/lib/model/schema";
import { cn } from "@/lib/utils";

function SessionsInner() {
  const router = useRouter();
  const selectedId = useSearchParams().get("id");
  const [sessions, setSessions] = useState<TrainingSession[] | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const reload = useCallback(async () => {
    const [s, e] = await Promise.all([repository.listSessions(), repository.listExercises()]);
    setSessions(s);
    setExercises(e);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Daten aus IndexedDB laden
    reload();
  }, [reload]);

  const selected = sessions?.find((s) => s.id === selectedId) ?? null;

  const create = async () => {
    const s = createTrainingSession();
    await repository.saveSession(s);
    await reload();
    router.push(`/sessions?id=${s.id}`);
  };

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[320px_1fr]">
        <section className={cn(selected && "hidden lg:block")}>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">Trainingseinheiten</h1>
            <Button variant="primary" size="sm" onClick={create} data-testid="new-session">
              <Plus /> Neu
            </Button>
          </div>
          {sessions === null ? (
            <p className="text-muted-fg">Lade …</p>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-[13px] text-muted-fg">
              Noch keine Trainingseinheit. Stelle aus deinen Übungen einen kompletten Trainingsablauf zusammen.
            </div>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => {
                const total = s.items.reduce((a, i) => a + i.durationMinutes, 0);
                return (
                  <li key={s.id}>
                    <Link
                      href={`/sessions?id=${s.id}`}
                      className={cn(
                        "block rounded-xl border p-3 transition-colors",
                        s.id === selectedId ? "border-accent/60 bg-accent-soft" : "border-border bg-card hover:bg-hover",
                      )}
                    >
                      <div className="truncate text-[14px] font-semibold">{s.name}</div>
                      <div className="mt-1 flex flex-wrap gap-3 text-[12px] text-muted-fg">
                        {s.date && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="size-3.5" />
                            {new Date(s.date).toLocaleDateString("de-DE")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {total} Min.
                        </span>
                        <span>{s.items.length} Übungen</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className={cn(!selected && "hidden lg:block")}>
          {selected ? (
            <SessionEditor
              key={selected.id}
              session={selected}
              exercises={exercises}
              onChanged={reload}
              onDeleted={async () => {
                await reload();
                router.push("/sessions");
              }}
            />
          ) : (
            <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-dashed border-border text-[13px] text-muted-fg">
              Einheit links auswählen oder neu anlegen.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SessionEditor({
  session,
  exercises,
  onChanged,
  onDeleted,
}: {
  session: TrainingSession;
  exercises: Exercise[];
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [s, setS] = useState(session);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  const change = (patch: Partial<TrainingSession>) => {
    const next = { ...s, ...patch, updatedAt: new Date().toISOString() };
    setS(next);
    // sofort speichern (IndexedDB ist schnell), Liste entprellt aktualisieren
    repository.saveSession(next).catch(() => toast.error("Speichern fehlgeschlagen"));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onChanged, 400);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const total = s.items.reduce((a, i) => a + i.durationMinutes, 0);
  const startsAt = s.items.reduce<number[]>((acc, it, i) => [...acc, i === 0 ? 0 : acc[i - 1] + s.items[i - 1].durationMinutes], []);

  const move = (i: number, dir: -1 | 1) => {
    const items = [...s.items];
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    change({ items });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/sessions" className="rounded-lg p-1.5 text-muted-fg hover:bg-hover lg:hidden" aria-label="Zurück">
          <X className="size-4" />
        </Link>
        <input
          aria-label="Name der Einheit"
          value={s.name}
          onChange={(e) => change({ name: e.target.value || " " })}
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-xl font-semibold tracking-tight hover:border-border focus:border-accent focus:outline-none"
        />
        <Button
          disabled={busy || !s.items.length}
          onClick={async () => {
            setBusy(true);
            try {
              const { exportSessionPdf } = await import("@/lib/export/exporters");
              exportSessionPdf(s, exMap);
              toast.success("PDF erstellt");
            } catch (e) {
              toast.error(`PDF fehlgeschlagen: ${e instanceof Error ? e.message : ""}`);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Loader2 className="animate-spin" /> : <FileText />} PDF
        </Button>
        <Button
          onClick={async () => {
            const { exportJson } = await import("@/lib/export/exporters");
            const used = s.items.map((i) => exMap.get(i.exerciseId)).filter((e): e is Exercise => !!e);
            exportJson([...new Map(used.map((e) => [e.id, e])).values()], [s], s.name);
          }}
        >
          <FileJson /> JSON
        </Button>
        <Button variant="ghost" aria-label="Einheit löschen" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="text-danger" />
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Datum">
          <Input type="date" value={s.date} onChange={(e) => change({ date: e.target.value })} />
        </Field>
        <Field label="Mannschaft">
          <Input value={s.team} placeholder="z. B. E1" onChange={(e) => change({ team: e.target.value })} />
        </Field>
        <Field label="Altersklasse">
          <Select value={s.ageGroup} onChange={(e) => change({ ageGroup: e.target.value as AgeGroup })}>
            {ageGroupSchema.options.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
        </Field>
        <Field label="Schwerpunkt">
          <Input value={s.focus} placeholder="z. B. Passspiel" onChange={(e) => change({ focus: e.target.value })} />
        </Field>
        <Field label="Notizen" className="sm:col-span-2 lg:col-span-4">
          <Textarea rows={2} value={s.notes} onChange={(e) => change({ notes: e.target.value })} />
        </Field>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">
            Ablauf <span className="font-normal text-muted-fg">· {total} Minuten</span>
          </h2>
          <Button size="sm" variant="primary" onClick={() => setPickerOpen(true)} data-testid="add-session-item">
            <Plus /> Übung hinzufügen
          </Button>
        </div>
        {s.items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-[13px] text-muted-fg">Füge Übungen aus deiner Bibliothek hinzu.</div>
        )}
        <ol className="space-y-2" data-testid="session-items">
          {s.items.map((item, i) => {
            const ex = exMap.get(item.exerciseId);
            const from = startsAt[i];
            const until = from + item.durationMinutes;
            return (
              <li key={item.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
                <div className="hidden w-32 shrink-0 overflow-hidden rounded-lg bg-[#2f7a3d] sm:block">
                  {ex?.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ex.thumbnail} alt="" className="aspect-[16/10] h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 rounded-md bg-hover px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-fg">
                      {from}–{until}′
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold">{ex?.name ?? "Übung nicht mehr vorhanden"}</div>
                      {ex && (
                        <div className="mt-0.5 flex gap-1">
                          <Badge>{ex.category}</Badge>
                          <Badge>{ex.ageGroup}</Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center">
                      {ex && (
                        <Link href={`/play?id=${ex.id}`} className="rounded-md p-1.5 text-muted-fg hover:bg-hover" aria-label="Abspielen">
                          <Play className="size-4" />
                        </Link>
                      )}
                      <button type="button" className="rounded-md p-1.5 text-muted-fg hover:bg-hover disabled:opacity-30" aria-label="Nach oben" disabled={i === 0} onClick={() => move(i, -1)}>
                        <ArrowUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-muted-fg hover:bg-hover disabled:opacity-30"
                        aria-label="Nach unten"
                        disabled={i === s.items.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown className="size-4" />
                      </button>
                      <button type="button" className="rounded-md p-1.5 text-muted-fg hover:bg-hover" aria-label="Entfernen" onClick={() => change({ items: s.items.filter((x) => x.id !== item.id) })}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 text-[12px] text-muted-fg">
                      Dauer
                      <Input
                        type="number"
                        min={0}
                        max={240}
                        value={item.durationMinutes}
                        className="h-8 w-16"
                        onChange={(e) =>
                          change({ items: s.items.map((x) => (x.id === item.id ? { ...x, durationMinutes: Math.max(0, Math.min(240, Number(e.target.value) || 0)) } : x)) })
                        }
                      />
                      Min.
                    </label>
                    <Input
                      placeholder="Hinweis für diese Einheit (optional)"
                      value={item.note}
                      className="h-8 min-w-40 flex-1"
                      onChange={(e) => change({ items: s.items.map((x) => (x.id === item.id ? { ...x, note: e.target.value } : x)) })}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        exercises={exercises}
        onPick={(ex) => {
          change({ items: [...s.items, { id: newId(), exerciseId: ex.id, durationMinutes: ex.durationMinutes, note: "" }] });
          toast.success(`„${ex.name}“ hinzugefügt`);
        }}
      />

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent title="Trainingseinheit löschen?" description="Die Übungen selbst bleiben in der Bibliothek erhalten.">
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfirmDelete(false)}>Abbrechen</Button>
            <Button
              variant="danger"
              onClick={async () => {
                await repository.deleteSession(s.id);
                setConfirmDelete(false);
                onDeleted();
              }}
            >
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExercisePicker({ open, onOpenChange, exercises, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; exercises: Exercise[]; onPick: (e: Exercise) => void }) {
  const [q, setQ] = useState("");
  const list = exercises.filter((e) => !q || `${e.name} ${e.category} ${e.ageGroup}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Übung hinzufügen" description="Klicke auf eine Übung, um sie an den Ablauf anzuhängen." className="max-w-xl">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-fg" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suchen …" className="pl-8" />
        </div>
        <ul className="thin-scroll max-h-[55vh] space-y-1.5 overflow-y-auto">
          {list.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => onPick(e)} className="flex w-full items-center gap-3 rounded-xl border border-border p-2 text-left hover:bg-hover">
                <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-[#2f7a3d]">
                  {e.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.thumbnail} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{e.name}</div>
                  <div className="text-[12px] text-muted-fg">
                    {e.category} · {e.ageGroup} · {e.durationMinutes} Min.
                  </div>
                </div>
                <Plus className="size-4 text-accent" />
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="py-6 text-center text-[13px] text-muted-fg">Keine Übungen gefunden.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export default function SessionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-fg">Lade …</div>}>
      <SessionsInner />
    </Suspense>
  );
}
