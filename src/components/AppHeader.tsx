"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Übungen" },
  { href: "/sessions", label: "Trainingseinheiten" },
];

export function AppHeader() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-sidebar/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-[13px] font-black text-accent-fg">CB</span>
          <span className="text-[15px] font-semibold tracking-tight">CoachBoard</span>
        </Link>
        <nav className="ml-2 flex gap-1">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn("rounded-lg px-3 py-1.5 text-[13px] font-medium", active ? "bg-accent-soft text-accent" : "text-muted-fg hover:bg-hover hover:text-fg")}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
