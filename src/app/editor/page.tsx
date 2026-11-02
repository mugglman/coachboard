"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EditorShell } from "@/components/editor/EditorShell";
import { useEditor } from "@/store/editorStore";
import { repository } from "@/lib/db/repository";

function EditorLoader() {
  const id = useSearchParams().get("id");
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let alive = true;
    if (!id) return;
    repository.getExercise(id).then((ex) => {
      if (!alive) return;
      if (!ex) return setState("missing");
      useEditor.getState().load(ex);
      setState("ready");
    });
    return () => {
      alive = false;
      useEditor.getState().reset();
    };
  }, [id]);

  if (id && state === "loading") return <div className="flex h-dvh items-center justify-center text-muted-fg">Übung wird geladen …</div>;
  if (!id || state === "missing")
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3">
        <p className="text-muted-fg">Diese Übung wurde nicht gefunden.</p>
        <Link href="/" className="font-medium text-accent">
          Zur Bibliothek
        </Link>
      </div>
    );
  return <EditorShell />;
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex h-dvh items-center justify-center text-muted-fg">Lade …</div>}>
      <EditorLoader />
    </Suspense>
  );
}
