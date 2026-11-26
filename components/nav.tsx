"use client";

import { usePathname } from "next/navigation";
import { History, Inbox, LayoutGrid, Settings, Users } from "lucide-react";
import { SegmentedLinks } from "@/components/ui/segmented";

const ic = { size: 17, strokeWidth: 1.9 } as const;
const ITEMS = [
  { href: "/", label: "Overview", icon: <LayoutGrid {...ic} /> },
  { href: "/people", label: "People", icon: <Users {...ic} /> },
  { href: "/replies", label: "Replies", icon: <Inbox {...ic} />, count: 4 },
  { href: "/logs", label: "History", icon: <History {...ic} /> },
  { href: "/settings", label: "Settings", icon: <Settings {...ic} /> },
];

export function Nav() {
  const path = usePathname() || "/";
  const active =
    ITEMS.slice()
      .reverse()
      .find((i) => (i.href === "/" ? path === "/" : path.startsWith(i.href)))?.href ?? "/";
  return <SegmentedLinks items={ITEMS} activeHref={active} label="Sections" />;
}
