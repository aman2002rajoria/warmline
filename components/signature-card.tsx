"use client";

import { Globe, Phone } from "lucide-react";
import type { Profile } from "@/lib/profile";

/** The signature card at the end of each email: photo, name, role, company, link, and the logo if there is one. */
export function SignatureCard({ p, compact }: { p: Profile; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-m border border-line bg-card ${compact ? "p-3" : "p-4"}`}>
      {p.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.photo} alt="" width={52} height={52} className="h-[52px] w-[52px] shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-accent-100 text-[17px] font-black text-accent-700">
          {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </span>
      )}
      <div className="min-w-0 flex-1 border-l-2 border-accent-500 pl-3">
        <div className="truncate font-extrabold text-ink">{p.name || "Your name"}</div>
        <div className="truncate text-body-s text-muted">{[p.role, p.company].filter(Boolean).join(", ") || "Your role, company"}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-label text-accent-600">
          {p.link ? <span className="inline-flex items-center gap-1"><Globe size={12} strokeWidth={2} />{p.link}</span> : null}
          {p.phone ? <span className="inline-flex items-center gap-1 text-muted"><Phone size={12} strokeWidth={2} />{p.phone}</span> : null}
        </div>
      </div>
      {p.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.logo} alt="" width={64} height={40} className="h-10 w-auto max-w-[80px] shrink-0 object-contain" />
      ) : null}
    </div>
  );
}
