"use client";

import { useEffect, useState } from "react";

/*
  Light / dark, exactly as on the portfolio: a sliding pill with a moon/sun knob, and the SUNSET / SUNRISE transition.
  The page is snapshotted (View Transitions) and the theme flips underneath. To dark: the light page shrinks into a
  circle that sinks below the bottom edge, turning warm and orange, like a sunset. To light: a golden circle rises
  from the bottom and grows to fill the screen, like a sunrise. Without View Transitions (or with reduced motion)
  it's a plain colour fade. First visit follows the system; after that the choice sticks.
*/
type Theme = "dark" | "light";
type VT = { ready: Promise<void>; finished: Promise<void> };

function sunTransition(n: Theme, start: (cb: () => void) => VT, apply: () => void) {
  const w = window.innerWidth, h = window.innerHeight;
  const cx = w / 2, cy = h * 1.15;
  const R = Math.hypot(cx, cy) + 40;
  const html = document.documentElement;
  html.dataset.vt = n;
  const vt = start(apply);
  const ease = "cubic-bezier(.65,0,.35,1)", D = 1400;
  const big = `circle(${R}px at ${cx}px ${cy}px)`, none = `circle(0px at ${cx}px ${cy}px)`;
  const warm = "sepia(.55) saturate(1.8) hue-rotate(-18deg) brightness(.95)";
  const dawn = "sepia(.4) saturate(1.6) hue-rotate(-8deg) brightness(1.12)";
  const anims: Animation[] = [];
  vt.ready.then(() => {
    if (n === "dark") {
      anims.push(html.animate({ clipPath: [big, none], filter: ["none", warm, warm] }, { duration: D, easing: ease, fill: "forwards", pseudoElement: "::view-transition-old(root)" }));
      anims.push(html.animate({ opacity: [0.6, 1] }, { duration: D, easing: ease, fill: "forwards", pseudoElement: "::view-transition-new(root)" }));
    } else {
      anims.push(html.animate({ clipPath: [none, big], filter: [dawn, dawn, "none"] }, { duration: D, easing: ease, fill: "forwards", pseudoElement: "::view-transition-new(root)" }));
    }
  }).catch(() => {});
  vt.finished.finally(() => { delete html.dataset.vt; anims.forEach((a) => a.cancel()); });
}

export function ThemeToggle() {
  const [t, setT] = useState<Theme | null>(null);
  useEffect(() => setT((document.documentElement.dataset.theme as Theme) ?? "light"), []);
  const flip = () => {
    const n: Theme = t === "dark" ? "light" : "dark";
    setT(n);
    try { localStorage.setItem("warmline-theme", n); } catch { /* not remembered */ }
    const html = document.documentElement;
    const apply = () => { html.dataset.theme = n; };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => VT };
    if (!doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      html.classList.add("theming");
      apply();
      setTimeout(() => html.classList.remove("theming"), 500);
      return;
    }
    sunTransition(n, doc.startViewTransition.bind(doc), apply);
  };
  return (
    <button type="button" className="theme-switch" onClick={flip} aria-label={`Switch to ${t === "dark" ? "light" : "dark"} theme`} title="Light / dark">
      <span className={`knob ${t ?? "light"}`} aria-hidden />
    </button>
  );
}

/** Runs before paint so the page never flashes the wrong theme. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("warmline-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;
