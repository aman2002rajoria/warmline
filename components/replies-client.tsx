"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Check, Clock3, Inbox, PenLine, Send, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { ChannelBadge } from "@/components/channel";
import { Avatar } from "@/components/professors/draft-panel";
import { byName, CHANNEL_LABEL, REPLIES, type Channel, type Lane, type Reply } from "@/lib/demo-people";

/*
  REPLIES, as an inbox. Every reply is sorted by what the person wants (not by date), says where it came in
  (Gmail, LinkedIn, X), and comes with a suggested answer that goes back on the same channel, after your click.
  Test data only: approving shows what would happen; nothing is sent.
*/
const LANES: { id: Lane; label: string; icon: JSX.Element; chip: string }[] = [
  { id: "interested", label: "Interested", icon: <ThumbsUp size={14} strokeWidth={2} />, chip: "bg-success-tint text-success-text" },
  { id: "later", label: "Later", icon: <Clock3 size={14} strokeWidth={2} />, chip: "bg-warning-tint text-warning-text" },
  { id: "no", label: "Not now", icon: <ThumbsDown size={14} strokeWidth={2} />, chip: "bg-surface-2 text-ink-2" },
];
const ago = (h: number) => (h < 1 ? "just now" : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`);

export function RepliesClient() {
  const [items, setItems] = useState<Reply[]>(REPLIES);
  const [done, setDone] = useState<string[]>([]);
  const [lane, setLane] = useState<Lane | "all">("all");
  const [channel, setChannel] = useState<Channel | "all">("all");
  const [activeId, setActiveId] = useState<string>(REPLIES[0].id);

  const open = items.filter((r) => !done.includes(r.id));
  const shown = useMemo(
    () => open.filter((r) => (lane === "all" || r.lane === lane) && (channel === "all" || r.channel === channel)),
    [open, lane, channel],
  );
  const active = shown.find((r) => r.id === activeId) ?? shown[0] ?? null;
  const count = (l: Lane) => open.filter((r) => r.lane === l).length;
  const channels = Array.from(new Set(items.map((r) => r.channel)));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-h2 text-ink">Replies</h1>
          <span className="text-body-s text-muted">{open.length} waiting · sorted by what each person wants</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter by channel">
          <span className="mr-1 text-label text-muted">Came in on</span>
          {(["all", ...channels] as const).map((c) => (
            <button key={c} type="button" role="tab" aria-selected={channel === c} onClick={() => setChannel(c)}
              className={`rounded-full px-2 py-1 transition-opacity ${channel === c ? "ring-2 ring-accent-500" : "opacity-70 hover:opacity-100"}`}>
              {c === "all" ? <span className="px-1 text-label font-extrabold text-ink">All</span> : <ChannelBadge channel={c} />}
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-stretch gap-4 md:h-[calc(100vh-196px)] md:min-h-[540px] md:grid-cols-12">
        <section className="card flex min-h-0 flex-col rounded-l p-3 md:col-span-5 lg:col-span-4" aria-label="Replies">
          <div className="flex flex-wrap gap-1.5 px-1 pb-2" role="tablist" aria-label="Filter by what they want">
            {([{ id: "all", label: "All", icon: <Inbox size={14} strokeWidth={2} /> }, ...LANES] as { id: Lane | "all"; label: string; icon: JSX.Element }[]).map((l) => (
              <button key={l.id} type="button" role="tab" aria-selected={lane === l.id} onClick={() => setLane(l.id)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold transition-colors ${lane === l.id ? "bg-ink text-bg" : "bg-surface text-ink-2 hover:text-ink"}`}>
                {l.icon} {l.label} <span className={lane === l.id ? "opacity-70" : "text-faint"}>{l.id === "all" ? open.length : count(l.id)}</span>
              </button>
            ))}
          </div>
          <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            {shown.map((r) => {
              const L = LANES.find((x) => x.id === r.lane)!;
              const on = active?.id === r.id;
              return (
                <li key={r.id}>
                  <button type="button" onClick={() => setActiveId(r.id)} aria-current={on ? "true" : undefined}
                    className={`flex w-full items-start gap-3 rounded-m p-3 text-left transition-colors ${on ? "bg-surface" : "hover:bg-surface"}`}>
                    <Avatar name={r.who} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-extrabold text-ink">{r.who}</span>
                        <span className="shrink-0 text-label text-faint">{ago(r.hoursAgo)}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-body-s text-ink-2">{r.text}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-extrabold ${L.chip}`}>{L.icon} {L.label}</span>
                        <ChannelBadge channel={r.channel} />
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
            {!shown.length ? (
              <li className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/art/A4-caught-up.webp" alt="" width={96} height={96} className="h-24 w-auto" />
                <p className="text-body-s text-muted">All caught up here.</p>
              </li>
            ) : null}
          </ul>
        </section>

        <div className="min-h-0 md:col-span-7 lg:col-span-8">
          {active ? (
            <Conversation
              key={active.id}
              r={active}
              onMove={(to) => setItems((xs) => xs.map((x) => (x.id === active.id ? { ...x, lane: to } : x)))}
              onDone={() => setDone((d) => [...d, active.id])}
            />
          ) : (
            <section className="card flex h-full flex-col items-center justify-center gap-3 rounded-l p-10 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/art/A4-caught-up.webp" alt="" width={140} height={140} className="h-[140px] w-auto" />
              <h2 className="text-h3 text-ink">Every reply has an answer</h2>
              <p className="max-w-[40ch] text-body-s text-muted">New replies show up here, sorted, with an answer ready for your click.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Conversation({ r, onMove, onDone }: { r: Reply; onMove: (l: Lane) => void; onDone: () => void }) {
  const [answer, setAnswer] = useState(r.answer);
  const [editing, setEditing] = useState(false);
  const person = byName(r.who);
  const first = r.who.split(" ")[0];
  const via = CHANNEL_LABEL[r.channel];
  const slots = ["Tue, 11:00 am", "Tue, 4:00 pm", "Thu, 5:30 pm"];

  return (
    <section className="card flex h-full min-h-0 flex-col overflow-hidden rounded-l" aria-label={`Reply from ${r.who}`}>
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4 md:px-6">
        <Avatar name={r.who} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-h3 text-ink">{r.who}</h2>
            <ChannelBadge channel={r.channel} />
          </div>
          <p className="truncate text-body-s text-muted">{r.company}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Sort this reply">
          {LANES.map((l) => (
            <button key={l.id} type="button" onClick={() => onMove(l.id)} aria-pressed={r.lane === l.id}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-extrabold transition-colors ${r.lane === l.id ? l.chip : "text-muted hover:bg-surface"}`}>
              {l.icon} {l.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5 md:p-6">
        {person?.lines ? (
          <div className="ml-auto max-w-[80%] rounded-m rounded-br-[6px] bg-accent-500 px-4 py-3 text-body-s text-white">
            <div className="mb-1 text-[11px] font-extrabold uppercase tracking-[.06em] text-white/75">You · the hook</div>
            {person.lines}
          </div>
        ) : null}
        <div className="max-w-[80%] rounded-m rounded-bl-[6px] bg-surface px-4 py-3">
          <div className="mb-1 text-[11px] font-extrabold uppercase tracking-[.06em] text-muted">
            {first} · via {via} · {ago(r.hoursAgo)}
          </div>
          <p className="text-body text-ink">{r.text}</p>
        </div>

        <div className="rounded-m bg-accent-50 p-4">
          <div className="flex items-center gap-1.5 text-label font-extrabold uppercase tracking-[.06em] text-accent-700">
            <Sparkles size={14} strokeWidth={2} /> Suggested answer · goes back on {via}
          </div>
          {editing ? (
            <Textarea className="mt-2 bg-card" rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} aria-label="Your answer" autoFocus />
          ) : (
            <p className="mt-2 text-body text-ink">{answer}</p>
          )}
          {r.lane === "interested" ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 inline-flex items-center gap-1 text-label text-muted"><CalendarClock size={14} strokeWidth={1.9} /> Offer a time</span>
              {slots.map((t) => (
                <button key={t} type="button" onClick={() => { setAnswer((a) => `${a.replace(/\s*Does .+ work for you\?$/, "")} Does ${t} work for you?`); toast.success(`Added ${t} to the answer.`); }}
                  className="rounded-full bg-card px-2.5 py-1 text-[12.5px] font-semibold text-ink-2 shadow-flat hover:text-accent-700">
                  {t}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3 md:px-6">
        <Button size="sm" variant="primary" onClick={() => { toast.success(`Test mode: your answer to ${first} would go out on ${via} now.`); onDone(); }}>
          <Send size={15} strokeWidth={1.9} /> Approve & send on {via}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing((e) => !e)}>
          {editing ? <Check size={15} strokeWidth={1.9} /> : <PenLine size={15} strokeWidth={1.9} />} {editing ? "Done" : "Edit"}
        </Button>
        {r.lane === "later" ? (
          <span className="inline-flex items-center gap-1 text-label text-muted"><CalendarClock size={14} strokeWidth={1.9} /> A reminder is set for March</span>
        ) : null}
        <span className="ml-auto text-label text-muted">Nothing goes out without your click.</span>
      </footer>
    </section>
  );
}
