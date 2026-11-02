"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { TopBar } from "./TopBar";
import { LeftToolbar } from "./LeftToolbar";
import { RightSidebar } from "./RightSidebar";
import { Timeline } from "./Timeline";
import { useAutosave, usePlayback, useShortcuts } from "./hooks";
import { useEditor } from "@/store/editorStore";

const EditorCanvas = dynamic(() => import("./EditorCanvas"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-muted-fg">Spielfeld wird geladen …</div>,
});

export function EditorShell() {
  usePlayback();
  useAutosave();
  useShortcuts();

  // Auf kleinen Bildschirmen Seitenleisten zunächst einklappen
  useEffect(() => {
    const w = window.innerWidth;
    if (w < 1100) useEditor.getState().setUi({ leftOpen: false });
    if (w < 900) useEditor.getState().setUi({ rightOpen: false });
    if (w < 640) useEditor.getState().setUi({ timelineOpen: false });
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <LeftToolbar />
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <EditorCanvas />
          </div>
          <Timeline />
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}
