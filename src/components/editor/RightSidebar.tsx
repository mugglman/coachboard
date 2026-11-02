"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Lock,
  LockOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Trash2,
  Route,
} from "lucide-react";
import { useEditor, type RightTab } from "@/store/editorStore";
import { MATERIAL_SWATCHES, OBJECT_SPECS, PATH_SPECS, TEAM_COLORS } from "@/lib/model/catalog";
import { ageGroupSchema, categorySchema, type Exercise, type PathKind, type Team } from "@/lib/model/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ObjectIcon, PathIcon } from "./ToolIcon";
import { Tip } from "@/components/ui/tooltip";

export function RightSidebar() {
  const open = useEditor((s) => s.rightOpen);
  const tab = useEditor((s) => s.rightTab);
  const setUi = useEditor((s) => s.setUi);

  if (!open) {
    return (
      <aside className="flex h-full w-[48px] shrink-0 flex-col items-center border-l border-border bg-sidebar pt-3">
        <Tip label="Seitenleiste ausklappen" side="left">
          <button type="button" aria-label="Seitenleiste ausklappen" className="rounded-md p-1.5 text-muted-fg hover:bg-hover" onClick={() => setUi({ rightOpen: true })}>
            <PanelRightOpen className="size-4" />
          </button>
        </Tip>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-border bg-sidebar" aria-label="Seitenleiste">
      <Tabs value={tab} onValueChange={(v) => setUi({ rightTab: v as RightTab })} className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-1 p-3 pb-2">
          <TabsList className="flex-1">
            <TabsTrigger value="steps">Schritte</TabsTrigger>
            <TabsTrigger value="objects">Objekte</TabsTrigger>
            <TabsTrigger value="properties">Eigensch.</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
          <button type="button" aria-label="Seitenleiste einklappen" className="rounded-md p-1.5 text-muted-fg hover:bg-hover" onClick={() => setUi({ rightOpen: false })}>
            <PanelRightClose className="size-4" />
          </button>
        </div>
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <TabsContent value="steps">
            <StepsPanel />
          </TabsContent>
          <TabsContent value="objects">
            <ObjectsPanel />
          </TabsContent>
          <TabsContent value="properties">
            <PropertiesPanel />
          </TabsContent>
          <TabsContent value="info">
            <InfoPanel />
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}

/* ------------------------------ Schritte ------------------------------ */

function StepsPanel() {
  const ex = useEditor((s) => s.exercise);
  const phaseIndex = useEditor((s) => s.phaseIndex);
  const st = useEditor.getState;
  if (!ex) return null;
  const phase = ex.phases[phaseIndex];
  return (
    <div className="space-y-3">
      <ol className="space-y-1.5" data-testid="phase-list">
        {ex.phases.map((p, i) => (
          <li key={p.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => st().setPhaseIndex(i)}
              onKeyDown={(e) => e.key === "Enter" && st().setPhaseIndex(i)}
              className={cn(
                "group flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
                i === phaseIndex ? "border-accent/50 bg-accent-soft" : "border-border bg-card hover:bg-hover",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  i === phaseIndex ? "bg-accent text-accent-fg" : "bg-hover text-muted-fg",
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{p.name}</div>
                <div className="text-[11px] text-muted-fg">
                  {p.duration.toFixed(1)} s · {p.paths.length} {p.paths.length === 1 ? "Weg" : "Wege"}
                </div>
              </div>
              <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                <IconBtn label="Nach oben" onClick={() => st().movePhase(i, -1)} disabled={i === 0}>
                  <ArrowUp />
                </IconBtn>
                <IconBtn label="Nach unten" onClick={() => st().movePhase(i, 1)} disabled={i === ex.phases.length - 1}>
                  <ArrowDown />
                </IconBtn>
                <IconBtn label="Duplizieren" onClick={() => st().duplicatePhase(i)}>
                  <Copy />
                </IconBtn>
                <IconBtn label="Löschen" onClick={() => st().deletePhase(i)} disabled={ex.phases.length <= 1}>
                  <Trash2 />
                </IconBtn>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <Button className="w-full" onClick={() => st().addPhase()} data-testid="add-phase">
        <Plus /> Schritt hinzufügen
      </Button>

      {phase && (
        <div key={phase.id} className="space-y-3 rounded-xl border border-border bg-card p-3">
          <Field label="Name des Schritts">
            <Input defaultValue={phase.name} onBlur={(e) => e.target.value !== phase.name && st().updatePhase(phaseIndex, { name: e.target.value || phase.name })} />
          </Field>
          <Field label={`Dauer: ${phase.duration.toFixed(1)} s`}>
            <input
              type="range"
              min={0.5}
              max={15}
              step={0.5}
              className="w-full"
              value={phase.duration}
              aria-label="Dauer des Schritts"
              onChange={(e) => st().updatePhase(phaseIndex, { duration: Number(e.target.value) })}
            />
          </Field>
          <Field label="Coaching-Hinweis">
            <Textarea
              defaultValue={phase.note}
              placeholder="Was passiert in diesem Schritt?"
              onBlur={(e) => e.target.value !== phase.note && st().updatePhase(phaseIndex, { note: e.target.value })}
            />
          </Field>
          <p className="text-[11px] leading-relaxed text-muted-fg">
            Spieler in diesem Schritt verschieben oder Wege zeichnen – die Animation läuft vom vorherigen Schritt zu diesem.
          </p>
        </div>
      )}
    </div>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="rounded-md p-1 text-muted-fg hover:bg-card hover:text-fg disabled:opacity-30 [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}

/* ------------------------------ Objekte ------------------------------ */

function ObjectsPanel() {
  const ex = useEditor((s) => s.exercise);
  const selection = useEditor((s) => s.selection);
  const phaseIndex = useEditor((s) => s.phaseIndex);
  const st = useEditor.getState;
  if (!ex) return null;
  const phase = ex.phases[phaseIndex];
  const pick = (type: "object" | "path", id: string) => {
    st().select({ type, id });
  };
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Objekte ({ex.objects.length})</div>
        {ex.objects.length === 0 && <p className="text-[12px] text-muted-fg">Noch keine Objekte. Wähle links ein Werkzeug und klicke ins Feld.</p>}
        <ul className="space-y-1" data-testid="object-list">
          {ex.objects.map((o) => (
            <li key={o.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => pick("object", o.id)}
                onDoubleClick={() => st().setUi({ rightTab: "properties" })}
                onKeyDown={(e) => e.key === "Enter" && pick("object", o.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px]",
                  selection?.id === o.id ? "bg-accent-soft text-fg" : "hover:bg-hover",
                )}
              >
                <ObjectIcon kind={o.kind} team={o.team} size={20} />
                <span className="flex-1 truncate">
                  {OBJECT_SPECS[o.kind].label}
                  {o.label && o.kind !== "text" ? ` ${o.label}` : o.kind === "text" ? `: ${o.label}` : ""}
                </span>
                <IconBtn label={o.locked ? "Entsperren" : "Sperren"} onClick={() => st().updateObject(o.id, { locked: !o.locked })}>
                  {o.locked ? <Lock /> : <LockOpen />}
                </IconBtn>
                <IconBtn
                  label="Löschen"
                  onClick={() => {
                    st().select({ type: "object", id: o.id });
                    st().deleteSelection();
                  }}
                >
                  <Trash2 />
                </IconBtn>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">
          Wege in Schritt {phaseIndex + 1} ({phase?.paths.length ?? 0})
        </div>
        <ul className="space-y-1">
          {phase?.paths.map((p) => {
            const obj = ex.objects.find((o) => o.id === p.objectId);
            return (
              <li key={p.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => pick("path", p.id)}
                  onKeyDown={(e) => e.key === "Enter" && pick("path", p.id)}
                  className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px]", selection?.id === p.id ? "bg-accent-soft" : "hover:bg-hover")}
                >
                  <PathIcon kind={p.kind} size={20} />
                  <span className="flex-1 truncate">
                    {PATH_SPECS[p.kind].label}
                    {obj ? ` · ${OBJECT_SPECS[obj.kind].label} ${obj.label}` : ""}
                  </span>
                  <IconBtn
                    label="Löschen"
                    onClick={() => {
                      st().select({ type: "path", id: p.id });
                      st().deleteSelection();
                    }}
                  >
                    <Trash2 />
                  </IconBtn>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ---------------------------- Eigenschaften ---------------------------- */

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {MATERIAL_SWATCHES.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Farbe ${c}`}
          onClick={() => onChange(c)}
          className={cn("size-6 rounded-full border border-border shadow-sm", value.toLowerCase() === c.toLowerCase() && "ring-2 ring-accent ring-offset-2 ring-offset-card")}
          style={{ background: c }}
        />
      ))}
      <input type="color" aria-label="Eigene Farbe" value={value} onChange={(e) => onChange(e.target.value)} className="size-7 cursor-pointer rounded border-0 bg-transparent p-0" />
    </div>
  );
}

function PropertiesPanel() {
  const ex = useEditor((s) => s.exercise);
  const selection = useEditor((s) => s.selection);
  const phaseIndex = useEditor((s) => s.phaseIndex);
  const st = useEditor.getState;
  if (!ex) return null;
  if (!selection) {
    return <p className="rounded-xl border border-dashed border-border p-4 text-center text-[12px] text-muted-fg">Wähle ein Objekt oder einen Weg auf dem Spielfeld aus, um es zu bearbeiten.</p>;
  }

  if (selection.type === "object") {
    const o = ex.objects.find((x) => x.id === selection.id);
    if (!o) return null;
    const spec = OBJECT_SPECS[o.kind];
    const isPlayer = o.kind === "player" || o.kind === "goalkeeper";
    return (
      <div key={o.id} className="space-y-3.5">
        <div className="flex items-center gap-2">
          <ObjectIcon kind={o.kind} team={o.team} />
          <div className="text-[14px] font-semibold">{spec.label}</div>
        </div>
        {(isPlayer || o.kind === "coach" || o.kind === "text" || o.kind === "zone") && (
          <Field label={o.kind === "text" ? "Text" : isPlayer ? "Nummer / Kürzel" : "Beschriftung"}>
            <Input data-testid="prop-label" defaultValue={o.label} maxLength={o.kind === "text" || o.kind === "zone" ? 60 : 4} onBlur={(e) => e.target.value !== o.label && st().updateObject(o.id, { label: e.target.value })} />
          </Field>
        )}
        {o.kind === "player" && (
          <Field label="Mannschaft">
            <div className="grid grid-cols-3 gap-1">
              {(["A", "B", "N"] as Team[]).map((t) => (
                <Button key={t} size="sm" variant={o.team === t ? "subtle" : "ghost"} onClick={() => st().updateObject(o.id, { team: t, color: TEAM_COLORS[t] })}>
                  <span className="size-3 rounded-full" style={{ background: TEAM_COLORS[t] }} />
                  {t === "N" ? "Neutral" : `Team ${t}`}
                </Button>
              ))}
            </div>
          </Field>
        )}
        {o.kind !== "ball" && (
          <Field label="Farbe">
            <ColorPicker value={o.color} onChange={(c) => st().updateObject(o.id, { color: c })} />
          </Field>
        )}
        {o.kind !== "zone" && (
          <Field label={`Größe: ${Math.round(o.size * 100)} %`}>
            <input type="range" min={0.5} max={2} step={0.1} value={o.size} className="w-full" aria-label="Größe" onChange={(e) => st().updateObject(o.id, { size: Number(e.target.value) })} />
          </Field>
        )}
        {o.kind === "zone" && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Breite (m)">
              <Input type="number" min={1} step={0.5} defaultValue={o.width} onBlur={(e) => st().updateObject(o.id, { width: Math.max(1, Number(e.target.value)) })} />
            </Field>
            <Field label="Höhe (m)">
              <Input type="number" min={1} step={0.5} defaultValue={o.height} onBlur={(e) => st().updateObject(o.id, { height: Math.max(1, Number(e.target.value)) })} />
            </Field>
          </div>
        )}
        {spec.rotatable && (
          <Field label={`Drehung: ${Math.round(o.rotation)}°`}>
            <input type="range" min={0} max={359} step={1} value={((o.rotation % 360) + 360) % 360} className="w-full" aria-label="Drehung" onChange={(e) => st().rotateObject(o.id, Number(e.target.value))} />
          </Field>
        )}
        <label className="flex items-center justify-between text-[13px]">
          Position sperren
          <input type="checkbox" checked={o.locked} onChange={(e) => st().updateObject(o.id, { locked: e.target.checked })} />
        </label>
        {spec.movable && (
          <p className="rounded-lg bg-hover p-2.5 text-[11px] leading-relaxed text-muted-fg">
            Verschieben in Schritt {phaseIndex + 1} erzeugt eine Bewegung in der Animation. Für Laufwege links „Laufweg“ wählen und am Spieler beginnen.
          </p>
        )}
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1" onClick={() => st().duplicateSelection()}>
            <Copy /> Duplizieren
          </Button>
          <Button size="sm" variant="danger" className="flex-1" onClick={() => st().deleteSelection()}>
            <Trash2 /> Löschen
          </Button>
        </div>
      </div>
    );
  }

  const found = ex.phases.flatMap((p) => p.paths).find((p) => p.id === selection.id);
  if (!found) return null;
  const path = found;
  const movers = ex.objects.filter((o) => OBJECT_SPECS[o.kind].movable);
  return (
    <div key={path.id} className="space-y-3.5">
      <div className="flex items-center gap-2">
        <Route className="size-5 text-accent" />
        <div className="text-[14px] font-semibold">{PATH_SPECS[path.kind].label}</div>
      </div>
      <Field label="Art des Weges">
        <Select value={path.kind} onChange={(e) => st().updatePath(path.id, { kind: e.target.value as PathKind, color: PATH_SPECS[e.target.value as PathKind].color })}>
          {(Object.keys(PATH_SPECS) as PathKind[]).map((k) => (
            <option key={k} value={k}>
              {PATH_SPECS[k].label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Bewegtes Objekt">
        <Select value={path.objectId ?? ""} onChange={(e) => st().updatePath(path.id, { objectId: e.target.value || undefined })}>
          <option value="">– nur Linie –</option>
          {movers.map((o) => (
            <option key={o.id} value={o.id}>
              {OBJECT_SPECS[o.kind].label} {o.label}
            </option>
          ))}
        </Select>
      </Field>
      {path.kind === "dribble" && (
        <Field label="Mitgeführter Ball">
          <Select value={path.carryId ?? ""} onChange={(e) => st().updatePath(path.id, { carryId: e.target.value || undefined })}>
            <option value="">– kein Ball –</option>
            {ex.objects
              .filter((o) => o.kind === "ball")
              .map((o, i) => (
                <option key={o.id} value={o.id}>
                  Ball {i + 1}
                </option>
              ))}
          </Select>
        </Field>
      )}
      <Field label="Farbe">
        <ColorPicker value={path.color} onChange={(c) => st().updatePath(path.id, { color: c })} />
      </Field>
      <Field label={`Startet bei ${Math.round(path.start * 100)} % des Schritts`}>
        <input type="range" min={0} max={0.95} step={0.05} value={path.start} className="w-full" aria-label="Startzeit" onChange={(e) => st().updatePath(path.id, { start: Math.min(Number(e.target.value), path.end - 0.05) })} />
      </Field>
      <Field label={`Endet bei ${Math.round(path.end * 100)} % des Schritts`}>
        <input type="range" min={0.05} max={1} step={0.05} value={path.end} className="w-full" aria-label="Endzeit" onChange={(e) => st().updatePath(path.id, { end: Math.max(Number(e.target.value), path.start + 0.05) })} />
      </Field>
      <Field label="Bewegung">
        <Select value={path.easing} onChange={(e) => st().updatePath(path.id, { easing: e.target.value as "linear" | "easeInOut" })}>
          <option value="easeInOut">Weich (beschleunigen/abbremsen)</option>
          <option value="linear">Gleichmäßig</option>
        </Select>
      </Field>
      <p className="rounded-lg bg-hover p-2.5 text-[11px] leading-relaxed text-muted-fg">Die weißen Punkte auf dem Feld lassen sich ziehen, um den Weg anzupassen.</p>
      <Button size="sm" variant="danger" className="w-full" onClick={() => st().deleteSelection()}>
        <Trash2 /> Weg löschen
      </Button>
    </div>
  );
}

/* ------------------------------ Info ------------------------------ */

type InfoForm = Pick<
  Exercise,
  "name" | "description" | "category" | "ageGroup" | "playerCount" | "durationMinutes" | "material" | "goals" | "coachingPoints" | "variations"
> & { tags: string };

function InfoPanel() {
  const ex = useEditor((s) => s.exercise);
  const update = useEditor((s) => s.update);
  const toForm = (e: Exercise): InfoForm => ({
    name: e.name,
    description: e.description,
    category: e.category,
    ageGroup: e.ageGroup,
    playerCount: e.playerCount,
    durationMinutes: e.durationMinutes,
    material: e.material,
    goals: e.goals,
    coachingPoints: e.coachingPoints,
    variations: e.variations,
    tags: e.tags.join(", "),
  });
  const { register, getValues, reset } = useForm<InfoForm>({ defaultValues: ex ? toForm(ex) : undefined });

  // Bei Undo/Redo oder Umbenennung in der Toolbar Formular synchronisieren
  useEffect(() => {
    if (ex) reset(toForm(ex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex?.name, ex?.category, ex?.ageGroup, ex?.durationMinutes, ex?.description, ex?.goals, ex?.coachingPoints, ex?.variations, ex?.material, ex?.playerCount, ex?.tags.join(",")]);

  if (!ex) return null;

  const commit = () => {
    const v = getValues();
    const tags = v.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const changed =
      v.name !== ex.name ||
      v.description !== ex.description ||
      v.category !== ex.category ||
      v.ageGroup !== ex.ageGroup ||
      v.playerCount !== ex.playerCount ||
      Number(v.durationMinutes) !== ex.durationMinutes ||
      v.material !== ex.material ||
      v.goals !== ex.goals ||
      v.coachingPoints !== ex.coachingPoints ||
      v.variations !== ex.variations ||
      tags.join(",") !== ex.tags.join(",");
    if (!changed) return;
    update((d) => {
      d.name = v.name.trim() || d.name;
      d.description = v.description;
      d.category = v.category;
      d.ageGroup = v.ageGroup;
      d.playerCount = v.playerCount;
      d.durationMinutes = Math.max(0, Math.min(240, Math.round(Number(v.durationMinutes) || 0)));
      d.material = v.material;
      d.goals = v.goals;
      d.coachingPoints = v.coachingPoints;
      d.variations = v.variations;
      d.tags = tags;
    });
  };

  return (
    <form className="space-y-3" onBlur={commit} onChange={(e) => (e.target as HTMLElement).tagName === "SELECT" && commit()} onSubmit={(e) => e.preventDefault()}>
      <Field label="Name der Übung">
        <Input {...register("name")} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Kategorie">
          <Select {...register("category")}>
            {categorySchema.options.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Altersklasse">
          <Select {...register("ageGroup")}>
            {ageGroupSchema.options.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Spieleranzahl">
          <Input placeholder="z. B. 8–12" {...register("playerCount")} />
        </Field>
        <Field label="Dauer (Min.)">
          <Input type="number" min={0} max={240} {...register("durationMinutes")} />
        </Field>
      </div>
      <Field label="Beschreibung / Ablauf">
        <Textarea rows={4} {...register("description")} />
      </Field>
      <Field label="Ziele">
        <Textarea rows={2} {...register("goals")} />
      </Field>
      <Field label="Coachingpunkte">
        <Textarea rows={3} {...register("coachingPoints")} />
      </Field>
      <Field label="Variationen">
        <Textarea rows={2} {...register("variations")} />
      </Field>
      <Field label="Material">
        <Input placeholder="z. B. 8 Hütchen, 4 Bälle" {...register("material")} />
      </Field>
      <Field label="Schlagwörter (mit Komma)">
        <Input placeholder="Rondo, Umschalten" {...register("tags")} />
      </Field>
    </form>
  );
}
