"use client";
import { useRef } from "react";
import { ChevronDown, ChevronUp, Ghost, Grid3x3, Pause, Play, Repeat, SkipBack, SkipForward, Square } from "lucide-react";
import { useEditor } from "@/store/editorStore";
import { phaseStartTimes, totalDuration } from "@/lib/animation/engine";
import { OBJECT_SPECS, PATH_SPECS } from "@/lib/model/catalog";
import { Button } from "@/components/ui/button";
import { Tip } from "@/components/ui/tooltip";
import { cn, formatTime } from "@/lib/utils";
import { PathIcon } from "./ToolIcon";

function useDrag() {
  return (e: React.PointerEvent, onMove: (clientX: number) => void, onEnd?: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    const move = (ev: PointerEvent) => onMove(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      onEnd?.();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
}

export function Timeline() {
  const ex = useEditor((s) => s.exercise);
  const time = useEditor((s) => s.time);
  const playing = useEditor((s) => s.playing);
  const speed = useEditor((s) => s.speed);
  const loop = useEditor((s) => s.loop);
  const phaseIndex = useEditor((s) => s.phaseIndex);
  const open = useEditor((s) => s.timelineOpen);
  const height = useEditor((s) => s.timelineHeight);
  const onion = useEditor((s) => s.onionSkin);
  const snap = useEditor((s) => s.snap);
  const selection = useEditor((s) => s.selection);
  const st = useEditor.getState;
  const trackRef = useRef<HTMLDivElement>(null);
  const pathTrackRef = useRef<HTMLDivElement>(null);
  const drag = useDrag();

  if (!ex) return null;
  const total = totalDuration(ex);
  const starts = phaseStartTimes(ex);
  const phase = ex.phases[phaseIndex];

  const timeFromX = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return 0;
    return ((clientX - r.left) / r.width) * total;
  };
  const fracFromX = (clientX: number) => {
    const r = pathTrackRef.current?.getBoundingClientRect();
    if (!r) return 0;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  const q = (v: number) => Math.round(v * 20) / 20;

  const ticks = [];
  const step = total > 40 ? 5 : total > 15 ? 2 : 1;
  for (let s = 0; s <= total + 0.001; s += step) ticks.push(s);

  return (
    <section
      className="relative shrink-0 border-t border-border bg-sidebar"
      style={{ height: open ? height : 48 }}
      aria-label="Animations-Timeline"
    >
      {open && (
        <div
          className="absolute -top-1 left-0 right-0 z-10 h-2 cursor-row-resize"
          title="Höhe ändern"
          onPointerDown={(e) => {
            const startY = e.clientY;
            const startH = height;
            e.preventDefault();
            const move = (ev: PointerEvent) => st().setUi({ timelineHeight: Math.max(120, Math.min(420, startH + (startY - ev.clientY))) });
            const up = () => {
              window.removeEventListener("pointermove", move);
              window.removeEventListener("pointerup", up);
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
          }}
        />
      )}

      {/* Steuerleiste */}
      <div className="flex h-12 items-center gap-1 border-b border-border px-3">
        <Tip label="Zum Anfang" side="top">
          <Button size="icon" variant="ghost" aria-label="Zum Anfang" onClick={() => (st().setPlaying(false), st().setTime(0))}>
            <SkipBack />
          </Button>
        </Tip>
        <Button
          size="icon"
          variant="primary"
          className="rounded-full"
          aria-label={playing ? "Pause" : "Abspielen"}
          data-testid="play-button"
          onClick={() => st().setPlaying(!playing)}
        >
          {playing ? <Pause /> : <Play className="translate-x-px" />}
        </Button>
        <Tip label="Stopp" side="top">
          <Button size="icon" variant="ghost" aria-label="Stopp" onClick={() => (st().setPlaying(false), st().setPhaseIndex(phaseIndex))}>
            <Square />
          </Button>
        </Tip>
        <Tip label="Nächster Schritt" side="top">
          <Button size="icon" variant="ghost" aria-label="Nächster Schritt" onClick={() => st().setPhaseIndex(phaseIndex + 1)}>
            <SkipForward />
          </Button>
        </Tip>
        <div className="ml-2 font-mono text-[12px] tabular-nums text-muted-fg" data-testid="time-display">
          <span className="text-fg">{formatTime(time)}</span> / {formatTime(total)}
        </div>
        <div className="ml-3 hidden items-center gap-1 sm:flex">
          {[0.5, 1, 1.5, 2].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => st().setSpeed(s)}
              className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", speed === s ? "bg-accent-soft text-accent" : "text-muted-fg hover:bg-hover")}
            >
              {s}×
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Tip label="Wiederholen" side="top">
            <Button size="icon" variant="ghost" active={loop} aria-label="Wiederholen" onClick={() => st().setLoop(!loop)}>
              <Repeat />
            </Button>
          </Tip>
          <Tip label="Vorherige Positionen anzeigen" side="top">
            <Button size="icon" variant="ghost" active={onion} aria-label="Vorherige Positionen anzeigen" onClick={() => st().setUi({ onionSkin: !onion })}>
              <Ghost />
            </Button>
          </Tip>
          <Tip label="Am Raster ausrichten (0,5 m)" side="top">
            <Button size="icon" variant="ghost" active={snap} aria-label="Am Raster ausrichten" onClick={() => st().setUi({ snap: !snap })}>
              <Grid3x3 />
            </Button>
          </Tip>
          <Tip label={open ? "Timeline einklappen" : "Timeline ausklappen"} side="top">
            <Button size="icon" variant="ghost" aria-label={open ? "Timeline einklappen" : "Timeline ausklappen"} onClick={() => st().setUi({ timelineOpen: !open })}>
              {open ? <ChevronDown /> : <ChevronUp />}
            </Button>
          </Tip>
        </div>
      </div>

      {open && (
        <div className="thin-scroll h-[calc(100%-48px)] overflow-y-auto px-3 py-2">
          {/* Gesamtspur: Schritte */}
          <div className="grid grid-cols-[110px_1fr] items-start gap-x-3 gap-y-1.5">
            <div className="pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Schritte</div>
            <div>
              <div
                className="relative h-4 cursor-pointer select-none"
                onPointerDown={(e) => {
                  st().setPlaying(false);
                  st().setTime(timeFromX(e.clientX));
                  drag(e, (x) => st().setTime(timeFromX(x)));
                }}
              >
                {ticks.map((s) => (
                  <span key={s} className="absolute top-0 -translate-x-1/2 text-[10px] tabular-nums text-muted-fg" style={{ left: `${(s / total) * 100}%` }}>
                    {s}s
                  </span>
                ))}
              </div>
              <div ref={trackRef} className="relative flex h-9 gap-0.5" data-testid="phase-track">
                {ex.phases.map((p, i) => (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => st().setPhaseIndex(i)}
                    onKeyDown={(e) => e.key === "Enter" && st().setPhaseIndex(i)}
                    className={cn(
                      "relative flex min-w-0 items-center overflow-hidden rounded-md border px-2 text-[12px] font-medium transition-colors",
                      i === phaseIndex ? "border-accent bg-accent-soft text-fg" : "border-border bg-card text-muted-fg hover:bg-hover",
                    )}
                    style={{ width: `${(p.duration / total) * 100}%` }}
                  >
                    <span className="truncate">
                      {i + 1}. {p.name}
                    </span>
                    <span
                      className="absolute right-0 top-0 h-full w-2 cursor-ew-resize hover:bg-accent/30"
                      title="Dauer ziehen"
                      onPointerDown={(e) => {
                        const startX = e.clientX;
                        const startD = p.duration;
                        const r = trackRef.current?.getBoundingClientRect();
                        const pxPerSec = r ? r.width / total : 50;
                        let lastD = startD;
                        drag(
                          e,
                          (x) => {
                            lastD = Math.max(0.5, Math.min(30, Math.round((startD + (x - startX) / pxPerSec) * 4) / 4));
                            const el = e.currentTarget.parentElement;
                            if (el) el.dataset.preview = String(lastD);
                          },
                          () => {
                            if (lastD !== startD) st().updatePhase(i, { duration: lastD });
                          },
                        );
                      }}
                    />
                  </div>
                ))}
                <div
                  className="pointer-events-none absolute -bottom-1 -top-5 w-0.5 bg-accent"
                  style={{ left: `${total ? (time / total) * 100 : 0}%` }}
                  data-testid="playhead"
                >
                  <div className="absolute -left-[5px] -top-0.5 size-3 rounded-full bg-accent" />
                </div>
              </div>
            </div>

            {/* Wege des aktuellen Schritts */}
            <div className="col-span-2 mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-fg">
              Zeitsteuerung Schritt {phaseIndex + 1} · {phase.duration.toFixed(1)} s
            </div>
            {phase.paths.length === 0 && (
              <p className="col-span-2 text-[12px] text-muted-fg">Keine Wege in diesem Schritt. Zeichne Lauf-, Pass- oder Dribbelwege, um ihr Timing hier zu steuern.</p>
            )}
            {phase.paths.map((path, idx) => {
              const obj = ex.objects.find((o) => o.id === path.objectId);
              const sel = selection?.type === "path" && selection.id === path.id;
              const localU = phase.duration ? Math.min(1, Math.max(0, (time - starts[phaseIndex]) / phase.duration)) : 0;
              return (
                <div key={path.id} className="contents">
                  <button
                    type="button"
                    onClick={() => st().select({ type: "path", id: path.id })}
                    className={cn("flex h-7 items-center gap-1.5 truncate rounded-md px-1 text-left text-[12px]", sel ? "text-accent" : "text-fg")}
                  >
                    <PathIcon kind={path.kind} size={16} />
                    <span className="truncate">
                      {PATH_SPECS[path.kind].label}
                      {obj ? ` ${OBJECT_SPECS[obj.kind].label === "Ball" ? "Ball" : obj.label}` : ""}
                    </span>
                  </button>
                  <div ref={idx === 0 ? pathTrackRef : undefined} className="relative h-7 rounded-md bg-hover">
                    <div
                      className={cn(
                        "absolute top-1 h-5 cursor-grab rounded border active:cursor-grabbing",
                        sel ? "border-accent bg-accent/40" : "border-accent/50 bg-accent/20",
                      )}
                      style={{ left: `${path.start * 100}%`, width: `${(path.end - path.start) * 100}%` }}
                      onPointerDown={(e) => {
                        st().select({ type: "path", id: path.id });
                        const f0 = fracFromX(e.clientX);
                        const s0 = path.start;
                        const e0 = path.end;
                        let next = { start: s0, end: e0 };
                        const bar = e.currentTarget as HTMLDivElement;
                        drag(
                          e,
                          (x) => {
                            const d = fracFromX(x) - f0;
                            const len = e0 - s0;
                            const start = q(Math.min(1 - len, Math.max(0, s0 + d)));
                            next = { start, end: q(start + len) };
                            bar.style.left = `${next.start * 100}%`;
                          },
                          () => (next.start !== s0 ? st().updatePath(path.id, next) : undefined),
                        );
                      }}
                    >
                      {(["start", "end"] as const).map((edge) => (
                        <span
                          key={edge}
                          className={cn("absolute top-0 h-full w-2 cursor-ew-resize rounded bg-accent/70", edge === "start" ? "left-0" : "right-0")}
                          onPointerDown={(e) => {
                            const bar = e.currentTarget.parentElement as HTMLDivElement;
                            let val = path[edge];
                            drag(
                              e,
                              (x) => {
                                const f = q(fracFromX(x));
                                val = edge === "start" ? Math.min(f, path.end - 0.05) : Math.max(f, path.start + 0.05);
                                const s = edge === "start" ? val : path.start;
                                const en = edge === "end" ? val : path.end;
                                bar.style.left = `${s * 100}%`;
                                bar.style.width = `${(en - s) * 100}%`;
                              },
                              () => st().updatePath(path.id, { [edge]: val }),
                            );
                          }}
                        />
                      ))}
                    </div>
                    <div className="pointer-events-none absolute bottom-0 top-0 w-px bg-accent" style={{ left: `${localU * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
