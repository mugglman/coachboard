"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Pause, Pencil, Play, RotateCcw } from "lucide-react";
import { repository } from "@/lib/db/repository";
import type { Exercise } from "@/lib/model/schema";
import { phaseIndexAt, phaseStartTimes, totalDuration } from "@/lib/animation/engine";
import { cn, formatTime } from "@/lib/utils";

const PlayerBoard = dynamic(() => import("@/components/player/PlayerBoard"), { ssr: false });

function Player() {
  const id = useSearchParams().get("id");
  const [ex, setEx] = useState<Exercise | null | undefined>(undefined);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timeRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    repository.getExercise(id).then((e) => setEx(e ?? null));
  }, [id]);

  useEffect(() => {
    if (!playing || !ex) return;
    const total = totalDuration(ex);
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(total, timeRef.current + ((now - last) / 1000) * speed);
      last = now;
      timeRef.current = t;
      setTime(t);
      if (t >= total) return setPlaying(false);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, ex, speed]);

  if (id && ex === undefined) return <div className="flex h-dvh items-center justify-center text-muted-fg">Lade …</div>;
  if (!ex)
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3">
        <p className="text-muted-fg">Übung nicht gefunden.</p>
        <Link href="/" className="text-accent">
          Zur Bibliothek
        </Link>
      </div>
    );

  const total = totalDuration(ex);
  const starts = phaseStartTimes(ex);
  const idx = phaseIndexAt(ex, Math.min(time, total - 0.0001));
  const phase = ex.phases[idx];
  const seek = (t: number) => {
    timeRef.current = t;
    setTime(t);
  };
  const toggle = () => {
    if (!playing && time >= total) seek(0);
    setPlaying(!playing);
  };
  const goPhase = (i: number) => {
    const j = Math.max(0, Math.min(ex.phases.length - 1, i));
    setPlaying(false);
    seek(starts[j]);
  };

  return (
    <div className="flex h-dvh flex-col bg-[#0f1a14] text-white">
      <header className="flex items-center gap-2 px-3 py-2">
        <Link href="/" aria-label="Zurück" className="rounded-lg p-2 hover:bg-white/10">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold">{ex.name}</h1>
          <p className="truncate text-[12px] text-white/60">
            {ex.category} · {ex.ageGroup} · {ex.durationMinutes} Min.
          </p>
        </div>
        <Link href={`/editor?id=${ex.id}`} aria-label="Bearbeiten" className="rounded-lg p-2 hover:bg-white/10">
          <Pencil className="size-5" />
        </Link>
      </header>
      <div className="min-h-0 flex-1 px-2" onClick={toggle}>
        <PlayerBoard exercise={ex} time={time} />
      </div>
      <div className="space-y-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="min-h-10 text-center">
          <div className="text-[14px] font-semibold">
            {idx + 1}/{ex.phases.length} · {phase.name}
          </div>
          {phase.note && <div className="mx-auto max-w-xl text-[13px] text-white/70">{phase.note}</div>}
        </div>
        <input
          type="range"
          min={0}
          max={total}
          step={0.01}
          value={time}
          onChange={(e) => (setPlaying(false), seek(Number(e.target.value)))}
          className="w-full"
          aria-label="Zeitleiste"
        />
        <div className="flex items-center justify-between">
          <span className="w-20 font-mono text-[12px] tabular-nums text-white/60">{formatTime(time)}</span>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Vorheriger Schritt" className="rounded-full p-2.5 hover:bg-white/10" onClick={() => goPhase(time > starts[idx] + 0.2 ? idx : idx - 1)}>
              <ChevronLeft className="size-6" />
            </button>
            <button type="button" aria-label={playing ? "Pause" : "Abspielen"} className="flex size-14 items-center justify-center rounded-full bg-[#00D4B4] text-[#062a25] shadow-lg" onClick={toggle} data-testid="player-play">
              {playing ? <Pause className="size-6" /> : time >= total ? <RotateCcw className="size-6" /> : <Play className="size-6 translate-x-0.5" />}
            </button>
            <button type="button" aria-label="Nächster Schritt" className="rounded-full p-2.5 hover:bg-white/10" onClick={() => goPhase(idx + 1)}>
              <ChevronRight className="size-6" />
            </button>
          </div>
          <div className="flex w-20 justify-end gap-1">
            {[0.5, 1, 2].map((s) => (
              <button key={s} type="button" onClick={() => setSpeed(s)} className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", speed === s ? "bg-white/20" : "text-white/60")}>
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="flex h-dvh items-center justify-center">Lade …</div>}>
      <Player />
    </Suspense>
  );
}
