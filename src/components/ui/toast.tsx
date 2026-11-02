"use client";
import { create } from "zustand";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}
interface ToastState {
  items: ToastItem[];
  push(kind: ToastKind, text: string): void;
}

let seq = 0;
export const useToast = create<ToastState>()((set) => ({
  items: [],
  push(kind, text) {
    const id = ++seq;
    set((s) => ({ items: [...s.items, { id, kind, text }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), kind === "error" ? 6000 : 3200);
  },
}));

export const toast = {
  success: (t: string) => useToast.getState().push("success", t),
  error: (t: string) => useToast.getState().push("error", t),
  info: (t: string) => useToast.getState().push("info", t),
};

export function Toaster() {
  const items = useToast((s) => s.items);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-[13px] shadow-soft",
          )}
        >
          {t.kind === "success" && <CheckCircle2 className="size-4 text-accent" />}
          {t.kind === "error" && <AlertTriangle className="size-4 text-danger" />}
          {t.kind === "info" && <Info className="size-4 text-muted-fg" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}
