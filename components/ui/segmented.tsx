"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/** Segmented control (§7): surface track, active option is a white pill. */
export const segTrack =
  "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-surface p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
/** The main nav sits inside the top bar's own pill, so it drops the track background. */
const navTrack = "flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function segItem(active: boolean) {
  return cn(
    "inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-label transition-[transform,background,color] duration-300 active:scale-[.94]",
    active
      ? "bg-ink text-bg shadow-[0_6px_14px_-6px_rgba(0,0,0,.4)]"
      : "text-muted hover:text-ink",
  );
}

export interface SegOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn(segTrack, className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={segItem(o.value === value)}
        >
          {o.label}
          {o.count !== undefined ? (
            <span className={cn("tabular", o.value === value ? "text-muted" : "text-faint")}>
              {o.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function SegmentedLinks({
  items,
  activeHref,
  label,
}: {
  items: { href: string; label: string; icon?: React.ReactNode; count?: number }[];
  activeHref: string;
  label: string;
}) {
  return (
    <nav aria-label={label} className={navTrack}>
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.href === activeHref ? "page" : undefined}
          className={segItem(it.href === activeHref)}
        >
          {it.icon}
          {it.label}
          {it.count ? <span className="ml-0.5 rounded-full bg-accent-500 px-1.5 text-[11px] font-extrabold leading-[18px] text-white">{it.count}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
