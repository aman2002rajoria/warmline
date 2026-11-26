"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/** Light / dark, like the portfolio. Remembers the choice; starts from the system setting. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);
  function flip() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("warmline-theme", next); } catch { /* not remembered */ }
    setDark(!dark);
  }
  return (
    <button
      type="button"
      onClick={flip}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-ink shadow-flat transition-transform active:scale-[.94]"
    >
      {dark ? <Sun size={18} strokeWidth={1.9} /> : <Moon size={18} strokeWidth={1.9} />}
    </button>
  );
}

/** Runs before paint so the page never flashes the wrong theme. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("warmline-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;
