"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/** Segmented control (§7): surface track, active option is a white pill. */
export const segTrack =
  "inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-surface p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function segItem(active: boolean) {
  return cn(
    "inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-label transition-[transform,background,color] duration-300 active:scale-[.94]",
    active
      ? "bg-white text-ink shadow-[0_0_0_1px_var(--line),0_1px_0_var(--line)]"
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
  items: { href: string; label: string }[];
  activeHref: string;
  label: string;
}) {
  return (
    <nav aria-label={label} className={segTrack}>
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.href === activeHref ? "page" : undefined}
          className={segItem(it.href === activeHref)}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
