"use client";
import { useEffect, useRef } from "react";
import { useEditor } from "@/store/editorStore";
import { phaseStates, totalDuration } from "@/lib/animation/engine";
import { repository } from "@/lib/db/repository";
import { renderThumbnail } from "@/lib/export/offscreen";

/** Wiedergabe-Schleife über requestAnimationFrame */
export function usePlayback() {
  const playing = useEditor((s) => s.playing);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const st = useEditor.getState();
      if (!st.exercise || !st.playing) return;
      const dt = ((now - last) / 1000) * st.speed;
      last = now;
      const total = totalDuration(st.exercise);
      let t = st.time + dt;
      if (t >= total) {
        if (st.loop) t = 0;
        else {
          st.setTime(total);
          useEditor.setState({ playing: false });
          return;
        }
      }
      st.setTime(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
}

/** Automatische Speicherung in IndexedDB (entprellt) inkl. Vorschaubild */
export function useAutosave(delay = 700) {
  const exercise = useEditor((s) => s.exercise);
  const status = useEditor((s) => s.saveStatus);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!exercise || status !== "dirty") return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const st = useEditor.getState();
      const current = st.exercise;
      if (!current) return;
      st.setSaveStatus("saving");
      try {
        let thumbnail = current.thumbnail;
        try {
          thumbnail = renderThumbnail(current);
        } catch {
          /* Vorschaubild ist optional */
        }
        await repository.saveExercise({ ...current, thumbnail });
        // nur als gespeichert markieren, wenn sich zwischenzeitlich nichts geändert hat
        if (useEditor.getState().exercise === current) useEditor.getState().setSaveStatus("saved");
        else useEditor.getState().setSaveStatus("dirty");
      } catch (err) {
        console.error(err);
        useEditor.getState().setSaveStatus("error");
      }
    }, delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [exercise, status, delay]);

  // Warnung beim Schließen, falls noch nicht gespeichert
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const s = useEditor.getState().saveStatus;
      if (s === "dirty" || s === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);

/** Tastenkürzel des Editors */
export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const st = useEditor.getState();
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z" && !e.shiftKey) return void (e.preventDefault(), st.undo());
      if (mod && (key === "y" || (key === "z" && e.shiftKey))) return void (e.preventDefault(), st.redo());
      if (mod && key === "c") return st.copySelection();
      if (mod && key === "v") return st.paste();
      if (mod && key === "d") return void (e.preventDefault(), st.duplicateSelection());
      if (mod) return;
      switch (key) {
        case "delete":
        case "backspace":
          e.preventDefault();
          st.deleteSelection();
          break;
        case "escape":
          st.setTool({ type: "select" });
          st.select(null);
          break;
        case " ":
          e.preventDefault();
          st.setPlaying(!st.playing);
          break;
        case "v":
          st.setTool({ type: "select" });
          break;
        case "h":
          st.setTool({ type: "pan" });
          break;
        case "l":
          st.setTool({ type: "path", kind: "run" });
          break;
        case "p":
          st.setTool({ type: "path", kind: "pass" });
          break;
        case "d":
          st.setTool({ type: "path", kind: "dribble" });
          break;
        case "s":
          st.setTool({ type: "path", kind: "shot" });
          break;
        case "f":
          st.requestFit();
          break;
        case "arrowleft":
        case "arrowright":
        case "arrowup":
        case "arrowdown": {
          if (st.selection?.type !== "object" || !st.exercise) {
            if (key === "arrowleft") st.setPhaseIndex(st.phaseIndex - 1);
            if (key === "arrowright") st.setPhaseIndex(st.phaseIndex + 1);
            break;
          }
          e.preventDefault();
          const step = e.shiftKey ? 2 : 0.5;
          const sel = st.selection;
          const obj = st.exercise.objects.find((o) => o.id === sel.id);
          if (!obj) break;
          const pose = phaseStates(st.exercise).after[st.phaseIndex][obj.id];
          const dx = key === "arrowleft" ? -step : key === "arrowright" ? step : 0;
          const dy = key === "arrowup" ? -step : key === "arrowdown" ? step : 0;
          st.moveObject(obj.id, pose.x + dx, pose.y + dy);
          break;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
