"use client";

import { usePathname } from "next/navigation";
import { SegmentedLinks } from "@/components/ui/segmented";

const ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/professors", label: "Professors" },
  { href: "/logs", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const path = usePathname() || "/";
  const active =
    ITEMS.slice()
      .reverse()
      .find((i) => (i.href === "/" ? path === "/" : path.startsWith(i.href)))?.href ?? "/";
  return <SegmentedLinks items={ITEMS} activeHref={active} label="Sections" />;
}
