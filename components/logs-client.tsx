"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BellRing, CalendarClock, ChevronDown, CircleAlert, ExternalLink, RefreshCw, Reply as ReplyIcon, Send, Sparkles } from "lucide-react";
import type { LogEntry, ProfessorRecord } from "@/types";
import { fmtDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Kpi } from "@/components/ui/kpi";
import { ChannelBadge } from "@/components/channel";
import { Avatar } from "@/components/professors/draft-panel";
import { byName, REPLIES, type Channel } from "@/lib/demo-people";

/*
  HISTORY: every event, newest first: sent, replied, follow-ups, scheduled and failed. Open a row to see how the
  hook was chosen (what was read, what was picked and why, what was written) and jump to the draft.
*/
type Kind = "sent" | "replied" | "followup" | "scheduled" | "failed";
type Ev = { id: string; kind: Kind; t: number; person?: ProfessorRecord; name: string; email: string; text: string; channel?: Channel };

const KINDS: { id: Kind | "all"; label: string; icon: JSX.Element; tone: string }[] = [
  { id: "all", label: "All", icon: <Sparkles size={14} strokeWidth={2} />, tone: "" },
  { id: "sent", label: "Sent", icon: <Send size={14} strokeWidth={2} />, tone: "bg-accent-50 text-accent-700" },
  { id: "replied", label: "Replied", icon: <ReplyIcon size={14} strokeWidth={2} />, tone: "bg-success-tint text-success-text" },
  { id: "followup", label: "Follow-ups", icon: <BellRing size={14} strokeWidth={2} />, tone: "bg-warning-tint text-warning-text" },
  { id: "scheduled", label: "Scheduled", icon: <CalendarClock size={14} strokeWidth={2} />, tone: "bg-accent-50 text-accent-700" },
  { id: "failed", label: "Failed", icon: <CircleAlert size={14} strokeWidth={2} />, tone: "bg-danger-tint text-danger-text" },
];
const LABEL: Record<Kind, string> = { sent: "Sent", replied: "Replied", followup: "Follow-up", scheduled: "Scheduled", failed: "Failed" };

export function LogsClient({
  sent,
  failed,
  people,
  testMode,
  appLog,
  errorsLog,
}: {
  sent: LogEntry[];
  failed: LogEntry[];
  people: ProfessorRecord[];
  testMode: boolean;
  appLog: string[];
  errorsLog: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<Kind | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  const events = useMemo(() => {
    const byId = new Map(people.map((p) => [p.id, p]));
    const byPerson = (name: string) => people.find((p) => p.professorName === name);
    const now = Date.now();
    const ev: Ev[] = [
      ...sent.map((l, i) => ({ id: `s${i}`, kind: "sent" as const, t: +new Date(l.timestamp), person: byId.get(l.professorId), name: l.professorName, email: l.email, text: l.subject || "" })),
      ...failed.map((l, i) => ({ id: `f${i}`, kind: "failed" as const, t: +new Date(l.timestamp), person: byId.get(l.professorId), name: l.professorName, email: l.email, text: l.errorMessage || "" })),
      ...(testMode ? REPLIES : [])
        .filter((r) => byPerson(r.who)?.status === "sent")
        .map((r) => ({ id: `r-${r.id}`, kind: "replied" as const, t: now - r.hoursAgo * 3600_000, person: byPerson(r.who), name: r.who, email: byPerson(r.who)?.email || "", text: r.text, channel: r.channel })),
      ...people.filter((p) => p.status === "approved" && p.scheduledAt).map((p) => ({ id: `sc-${p.id}`, kind: "scheduled" as const, t: +new Date(p.scheduledAt!), person: p, name: p.professorName, email: p.email, text: p.finalSubject || "" })),
      ...people.filter((p) => p.followUpSent).map((p) => ({ id: `fu-${p.id}`, kind: "followup" as const, t: +new Date(p.updatedAt), person: p, name: p.professorName, email: p.email, text: "Follow-up sent: a short nudge, same thread." })),
    ];
    return ev.sort((a, b) => b.t - a.t);
  }, [sent, failed, people, testMode]);

  const shown = kind === "all" ? events : events.filter((e) => e.kind === kind);
  const replies = events.filter((e) => e.kind === "replied").length;
  const attempts = sent.length + failed.length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 text-ink">History</h1>
          <p className="mt-3 text-body-l text-muted">Every send, reply and follow-up, newest first. Open one to see how its hook was chosen.</p>
        </div>
        <Button variant="ghost" onClick={() => start(() => router.refresh())} disabled={pending}>
          <RefreshCw size={20} strokeWidth={1.75} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi index={0} label="Sent" value={sent.length} accent sub="from your Gmail" />
        <Kpi index={1} label="Replies" value={replies} sub={sent.length ? `${Math.round((replies / sent.length) * 100)}% reply rate` : "none yet"} />
        <Kpi index={2} label="Went through" value={attempts ? Math.round((sent.length / attempts) * 100) : 0} suffix="%" sub={attempts ? `of ${attempts} attempts` : "no attempts yet"} />
        <Kpi index={3} label="Failed" value={failed.length} sub={failed.length ? "reason shown on each" : "none so far"} />
      </div>

      <section className="card mt-6 rounded-l p-3 md:p-4">
        <div className="flex flex-wrap gap-1.5 px-1 pb-3" role="tablist" aria-label="Filter history">
          {KINDS.map((k) => {
            const n = k.id === "all" ? events.length : events.filter((e) => e.kind === k.id).length;
            if (k.id !== "all" && !n) return null;
            return (
              <button key={k.id} type="button" role="tab" aria-selected={kind === k.id} onClick={() => setKind(k.id)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors ${kind === k.id ? "bg-ink text-bg" : "bg-surface text-ink-2 hover:text-ink"}`}>
                {k.icon} {k.label} <span className={kind === k.id ? "opacity-70" : "text-faint"}>{n}</span>
              </button>
            );
          })}
        </div>

        {shown.length === 0 ? (
          <p className="px-2 py-10 text-center text-body-s text-muted">Nothing here yet. Approved emails you send are listed here with how each was written.</p>
        ) : (
          <ul className="flex flex-col">
            {shown.map((e) => {
              const K = KINDS.find((k) => k.id === e.kind)!;
              const isOpen = open === e.id;
              return (
                <li key={e.id} className="border-t border-line first:border-t-0">
                  <button type="button" onClick={() => setOpen(isOpen ? null : e.id)} aria-expanded={isOpen}
                    className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-m px-2 py-3 text-left transition-colors hover:bg-surface md:grid-cols-[auto_minmax(0,1.1fr)_minmax(0,1.6fr)_auto_auto]">
                    <Avatar name={e.name} size={36} />
                    <div className="min-w-0">
                      <div className="truncate font-extrabold text-ink">{e.name}</div>
                      <div className="truncate text-label text-muted">{e.person ? [e.person.department, e.person.university].filter(Boolean).join(" · ") : e.email}</div>
                    </div>
                    <div className="hidden min-w-0 items-center gap-2 md:flex">
                      {e.channel ? <ChannelBadge channel={e.channel} /> : null}
                      <span className={`truncate text-body-s ${e.kind === "failed" ? "text-danger-text" : "text-ink-2"}`}>{e.kind === "replied" ? `“${e.text}”` : e.text}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-extrabold ${K.tone}`}>{K.icon} {LABEL[e.kind]}</span>
                    <span className="hidden w-[150px] items-center justify-end gap-2 text-right text-label text-muted md:flex">
                      {fmtDateTime(new Date(e.t).toISOString())}
                      <ChevronDown size={16} strokeWidth={1.9} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  {isOpen ? <HowItWasWritten e={e} /> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {appLog.length || errorsLog.length ? (
        <details className="card mt-4 rounded-l p-5">
          <summary className="cursor-pointer font-extrabold text-ink">App and error logs</summary>
          <pre className="mt-3 max-h-[50vh] overflow-auto rounded-m bg-surface p-4 font-mono text-mono text-ink-2">{[...errorsLog, ...appLog].join("\n") || "Empty."}</pre>
        </details>
      ) : null}
    </>
  );
}

/** The chain behind one email: what was read, what was picked and why, what was written. */
function HowItWasWritten({ e }: { e: Ev }) {
  const p = e.person;
  const extra = byName(e.name);
  const sources = extra?.activity ?? [];
  const hook = sources.find((s) => s.hook);
  const sheet = p ? ([p.researchArea && `Works on: ${p.researchArea}`, p.department && `Role: ${p.department}`, p.notes && `Your notes: ${p.notes}`].filter(Boolean) as string[]) : [];
  const steps = [
    {
      t: `Read ${sources.length + sheet.length} things about ${e.name.split(" ")[0]}`,
      body: (
        <ul className="mt-1 flex flex-col gap-1">
          {sources.map((s) => <li key={s.text} className="text-body-s text-ink-2"><span className="font-semibold">{s.source}</span> · {s.when}: {s.text}</li>)}
          {sheet.map((s) => <li key={s} className="text-body-s text-ink-2">From your sheet · {s}</li>)}
          {!sources.length && !sheet.length ? <li className="text-body-s text-muted">Only a name and company, so the lines stay general.</li> : null}
        </ul>
      ),
    },
    {
      t: "Picked one thing worth mentioning",
      body: hook ? (
        <p className="mt-1 text-body-s text-ink-2">
          <span className="font-semibold text-ink">{hook.text}</span> ({hook.source}, {hook.when}). The most recent thing that&rsquo;s specific to them and close to the problem the email is about.
        </p>
      ) : <p className="mt-1 text-body-s text-ink-2">{p?.researchArea || "Nothing specific, so it used the role and company."}</p>,
    },
    { t: "Wrote two or three personal lines", body: <p className="mt-1 rounded-s bg-accent-50 px-3 py-2 text-body-s text-ink">{p?.personalizedLines || "No lines yet."}</p> },
    { t: "Wrote a subject that points at the same hook", body: <p className="mt-1 text-body-s font-semibold text-ink">{p?.finalSubject || "—"}</p> },
  ];
  return (
    <div className="mx-2 mb-4 grid gap-4 rounded-m bg-surface p-4 md:grid-cols-[minmax(0,1fr)_auto] md:p-5">
      <ol className="relative flex flex-col gap-4 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-line">
        {steps.map((s, i) => (
          <li key={s.t} className="relative flex gap-3">
            <span className="relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-500 text-[12px] font-black text-white">{i + 1}</span>
            <div className="min-w-0">
              <div className="font-extrabold text-ink">{s.t}</div>
              {s.body}
            </div>
          </li>
        ))}
      </ol>
      {p ? (
        <div className="flex flex-col gap-2 md:w-[180px]">
          <Link href={`/people?open=${encodeURIComponent(p.id)}`} className="btn primary sm"><ExternalLink size={15} strokeWidth={1.9} /> Open draft</Link>
          {e.kind === "replied" ? <Link href="/replies" className="btn ghost sm"><ReplyIcon size={15} strokeWidth={1.9} /> Answer reply</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
