"use client";
import { Hand, MousePointer2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEditor, type Tool } from "@/store/editorStore";
import { PATH_SPECS, PLACEABLE_GROUPS } from "@/lib/model/catalog";
import { PITCH_SPECS } from "@/lib/model/pitch";
import type { PathKind, PitchFormat } from "@/lib/model/schema";
import { cn } from "@/lib/utils";
import { Tip } from "@/components/ui/tooltip";
import { ObjectIcon, PathIcon } from "./ToolIcon";
import { DND_MIME } from "./constants";

function sameTool(a: Tool, b: Tool): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "place" && b.type === "place") return a.kind === b.kind && a.team === b.team;
  if (a.type === "path" && b.type === "path") return a.kind === b.kind;
  return true;
}

function ToolButton({
  tool,
  label,
  icon,
  compact,
  draggablePayload,
  shortcut,
}: {
  tool: Tool;
  label: string;
  icon: React.ReactNode;
  compact: boolean;
  draggablePayload?: string;
  shortcut?: string;
}) {
  const active = useEditor((s) => sameTool(s.tool, tool));
  const setTool = useEditor((s) => s.setTool);
  const btn = (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      data-tool={label}
      draggable={!!draggablePayload}
      onDragStart={(e) => {
        if (!draggablePayload) return;
        e.dataTransfer.setData(DND_MIME, draggablePayload);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => setTool(active && tool.type !== "select" ? { type: "select" } : tool)}
      className={cn(
        "group flex items-center gap-2 rounded-lg border border-transparent text-left text-[12px] font-medium transition-colors",
        compact ? "h-10 w-10 justify-center" : "h-[62px] flex-col justify-center px-1 text-center",
        active ? "border-accent/40 bg-accent-soft text-accent" : "text-fg hover:bg-hover",
      )}
    >
      <span className="flex h-6 items-center justify-center">{icon}</span>
      {!compact && <span className="line-clamp-1 text-[11px] leading-tight">{label}</span>}
    </button>
  );
  return compact || shortcut ? (
    <Tip label={shortcut ? `${label} (${shortcut})` : label} side="right">
      {btn}
    </Tip>
  ) : (
    btn
  );
}

const PATH_SHORTCUTS: Record<PathKind, string> = { run: "L", pass: "P", dribble: "D", shot: "S" };

export function LeftToolbar() {
  const open = useEditor((s) => s.leftOpen);
  const setUi = useEditor((s) => s.setUi);
  const pitch = useEditor((s) => s.exercise?.pitch);
  const update = useEditor((s) => s.update);
  const compact = !open;

  return (
    <aside
      className={cn(
        "thin-scroll flex h-full shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar transition-[width] duration-200",
        open ? "w-[260px]" : "w-[60px]",
      )}
      aria-label="Werkzeuge"
    >
      <div className={cn("flex items-center px-3 pb-1 pt-3", compact ? "justify-center px-0" : "justify-between")}>
        {!compact && <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Werkzeuge</span>}
        <button
          type="button"
          className="rounded-md p-1.5 text-muted-fg hover:bg-hover"
          onClick={() => setUi({ leftOpen: !open })}
          aria-label={open ? "Werkzeugleiste einklappen" : "Werkzeugleiste ausklappen"}
        >
          {open ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
        </button>
      </div>

      <Section title="Bearbeiten" compact={compact}>
        <ToolButton tool={{ type: "select" }} label="Auswählen" shortcut="V" compact={compact} icon={<MousePointer2 className="size-[18px]" />} />
        <ToolButton tool={{ type: "pan" }} label="Verschieben" shortcut="H" compact={compact} icon={<Hand className="size-[18px]" />} />
      </Section>

      {PLACEABLE_GROUPS.map((g) => (
        <Section key={g.title} title={g.title} compact={compact}>
          {g.items.map((it) => (
            <ToolButton
              key={`${it.kind}-${it.team ?? ""}`}
              tool={{ type: "place", kind: it.kind, team: it.team }}
              label={it.label}
              compact={compact}
              draggablePayload={JSON.stringify({ kind: it.kind, team: it.team })}
              icon={<ObjectIcon kind={it.kind} team={it.team} />}
            />
          ))}
        </Section>
      ))}

      <Section title="Wege" compact={compact}>
        {(Object.keys(PATH_SPECS) as PathKind[]).map((k) => (
          <ToolButton
            key={k}
            tool={{ type: "path", kind: k }}
            label={PATH_SPECS[k].label}
            shortcut={PATH_SHORTCUTS[k]}
            compact={compact}
            icon={<PathIcon kind={k} />}
          />
        ))}
      </Section>

      {!compact && pitch && (
        <div className="space-y-2 border-t border-border px-3 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Spielfeld</div>
          <select
            aria-label="Spielfeldformat"
            className="h-9 w-full rounded-lg border border-border bg-card px-2 text-[13px]"
            value={pitch.format}
            onChange={(e) => update((d) => void (d.pitch.format = e.target.value as PitchFormat))}
          >
            {(Object.keys(PITCH_SPECS) as PitchFormat[]).map((f) => (
              <option key={f} value={f}>
                {PITCH_SPECS[f].label}
              </option>
            ))}
          </select>
          <label className="flex items-center justify-between text-[13px]">
            Rasenstreifen
            <input type="checkbox" checked={pitch.stripes} onChange={(e) => update((d) => void (d.pitch.stripes = e.target.checked))} className="accent-[var(--accent)]" />
          </label>
          <label className="flex items-center justify-between text-[13px]">
            Dunkle Variante
            <input
              type="checkbox"
              checked={pitch.variant === "dunkel"}
              onChange={(e) => update((d) => void (d.pitch.variant = e.target.checked ? "dunkel" : "natur"))}
              className="accent-[var(--accent)]"
            />
          </label>
        </div>
      )}
      {!compact && (
        <p className="mt-auto px-3 pb-3 pt-2 text-[11px] leading-relaxed text-muted-fg">
          Tipp: Material per Klick oder Drag &amp; Drop platzieren. Wege direkt am Spieler oder Ball beginnen – dann bewegt er sich in der Animation mit.
        </p>
      )}
    </aside>
  );
}

function Section({ title, compact, children }: { title: string; compact: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("px-3 py-2", compact && "px-2")}>
      {!compact && <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">{title}</div>}
      <div className={cn(compact ? "flex flex-col items-center gap-1" : "grid grid-cols-3 gap-1")}>{children}</div>
    </div>
  );
}
