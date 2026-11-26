"use client";

import { useEffect, useRef, useState } from "react";
import { Toaster as Sonner } from "sonner";
import { cn } from "@/lib/utils";

/** Three pulsing dots plus a line saying what is happening (§11.6). */
export function Working({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-body-s text-muted", className)} role="status">
      <span className="dots text-accent-500" aria-hidden>
        <span />
        <span />
        <span />
      </span>
      <span>{children}</span>
    </div>
  );
}

/** Placeholder until the glossy 3D render exists (§13). */
export function Illustration({ object, size = 112 }: { object: string; size?: number }) {
  return (
    <div
      className="pop flex items-center justify-center rounded-m border-[1.5px] border-dashed border-accent-200 bg-accent-50 font-mono text-mono text-accent-700"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {object}
    </div>
  );
}

export function EmptyState({
  object,
  title,
  text,
  children,
  className,
}: {
  object: string;
  title: string;
  text: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-10 text-center", className)}>
      <Illustration object={object} />
      <h3 className="mt-6 text-h3 text-ink">{title}</h3>
      <p className="mt-2 max-w-[44ch] text-body text-muted">{text}</p>
      {children ? <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div> : null}
    </div>
  );
}

/** Counts up once on first load (§14). */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = useState(value);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) {
      setShown(value);
      return;
    }
    started.current = true;
    if (value === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 800);
      setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    setShown(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={cn("tabular", className)}>{shown.toLocaleString("en-IN")}</span>;
}

/** Toasts: bottom centre, ink pill, white text (§7). */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      duration={4000}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-full bg-ink px-5 py-3 text-[15px] font-medium text-bg shadow-float",
          title: "font-medium",
          description: "text-bg opacity-70",
          actionButton: "ml-auto font-semibold text-accent-200",
          icon: "hidden",
        },
      }}
    />
  );
}
