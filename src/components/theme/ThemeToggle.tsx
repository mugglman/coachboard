"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export const THEME_KEY = "coachboard-theme";

/** Inline-Skript gegen Aufblitzen des falschen Themes */
export const themeInitScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* ignorieren */
    }
  };
  return (
    <Button size="icon" variant="ghost" onClick={toggle} aria-label={dark ? "Hellen Modus aktivieren" : "Dunklen Modus aktivieren"}>
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}
