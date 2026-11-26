"use client";

import { useState } from "react";
import { CalendarClock, Check, Clock3, PenLine, Send, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";

/*
  REPLIES. Every reply is sorted by what the person wants, not by date, and comes with a suggested answer
  that still waits for your click. Test data only: approving shows what would happen; nothing is emailed.
*/
type Lane = "interested" | "later" | "no";
type Reply = { id: string; who: string; img?: string; company: string; text: string; ago: string; lane: Lane; answer: string };

const REPLIES: Reply[] = [
  { id: "kabir", who: "Kabir Shah", img: "/art/P-kabir.webp", company: "Senior PM, CRED", lane: "interested", ago: "1h ago",
    text: "Happy to chat. Thursday after 5 works. Send me what you want to cover?",
    answer: "Thursday 5:30 works, thank you! I'll send an invite with the three things I'd love to ask about the bill-payments roadmap." },
  { id: "priya", who: "Priya Menon", img: "/art/P-priya.webp", company: "Product Lead, Razorpay", lane: "interested", ago: "3h ago",
    text: "This is timely, we've been looking at exactly this drop-off. Could you do next Tuesday?",
    answer: "Tuesday is perfect. Would 11 am or 4 pm suit you better? I'll bring the prototype and keep it to 20 minutes." },
  { id: "meera", who: "Meera Iyer", img: "/art/P-meera.webp", company: "Head of Partnerships, Zepto", lane: "later", ago: "Yesterday",
    text: "Not this quarter, we're heads-down on a launch. Try me in March?",
    answer: "Completely understand, good luck with the launch! I'll check back in early March." },
  { id: "neha", who: "Neha Gupta", company: "Design Lead, Swiggy", lane: "no", ago: "2 days ago",
    text: "Not the right person for this, sorry. Ravi on our payments team might be.",
    answer: "No problem at all, thanks for pointing me to Ravi. Would you be comfortable introducing us, or should I write to him directly?" },
];

const LANES: { id: Lane; label: string; icon: React.ReactNode; tone: string }[] = [
  { id: "interested", label: "Interested", icon: <ThumbsUp size={16} strokeWidth={1.9} />, tone: "text-accent-700 bg-accent-50" },
  { id: "later", label: "Later", icon: <Clock3 size={16} strokeWidth={1.9} />, tone: "text-warning-text bg-warning-tint" },
  { id: "no", label: "Not now", icon: <ThumbsDown size={16} strokeWidth={1.9} />, tone: "text-muted bg-surface" },
];

export function RepliesClient() {
  const [done, setDone] = useState<string[]>([]);
  const left = REPLIES.filter((r) => !done.includes(r.id));
  return (
    <div>
      <PageHeader
        title="Replies"
        sub="Sorted by what each person wants, with an answer ready. Nothing goes out without your click."
      />
      <div className="grid items-start gap-4 md:grid-cols-3">
        {LANES.map((lane) => {
          const items = left.filter((r) => r.lane === lane.id);
          return (
            <section key={lane.id} className="rounded-l bg-surface p-3" aria-label={lane.label}>
              <header className="flex items-center justify-between px-2 pb-3 pt-1">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-label font-extrabold ${lane.tone}`}>
                  {lane.icon}
                  {lane.label}
                </span>
                <span className="text-label text-muted">{items.length}</span>
              </header>
              {items.length ? (
                <div className="flex flex-col gap-3">
                  {items.map((r) => (
                    <ReplyCard key={r.id} r={r} highlight={lane.id === "interested"} onDone={() => setDone((d) => [...d, r.id])} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/art/A4-caught-up.webp" alt="" width={88} height={88} className="h-[88px] w-auto" />
                  <p className="text-body-s text-muted">All caught up here.</p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ReplyCard({ r, highlight, onDone }: { r: Reply; highlight: boolean; onDone: () => void }) {
  const [editing, setEditing] = useState(false);
  const [answer, setAnswer] = useState(r.answer);
  return (
    <article className={`card rounded-m p-4 ${highlight ? "ring-2 ring-accent-200" : ""}`}>
      <div className="flex items-center gap-3">
        {r.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.img} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 font-black text-accent-700">
            {r.who[0]}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-extrabold text-ink">{r.who}</div>
          <div className="truncate text-body-s text-muted">{r.company}</div>
        </div>
        <span className="shrink-0 text-label text-faint">{r.ago}</span>
      </div>
      <p className="mt-3 text-body text-ink-2">&ldquo;{r.text}&rdquo;</p>
      <div className="mt-3 rounded-s bg-accent-50 p-3">
        <div className="flex items-center gap-1.5 text-label font-extrabold uppercase tracking-[.06em] text-accent-700">
          <Sparkles size={14} strokeWidth={2} /> Suggested answer
        </div>
        {editing ? (
          <Textarea className="mt-2 bg-white" rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} aria-label="Your answer" autoFocus />
        ) : (
          <p className="mt-1.5 text-body-s text-ink">{answer}</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            toast.success(`Test mode: your answer to ${r.who.split(" ")[0]} would go out now from your Gmail.`);
            onDone();
          }}
        >
          <Send size={15} strokeWidth={1.9} /> Approve & send
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing((e) => !e)}>
          {editing ? <Check size={15} strokeWidth={1.9} /> : <PenLine size={15} strokeWidth={1.9} />}
          {editing ? "Done" : "Edit"}
        </Button>
        {r.lane === "later" ? (
          <span className="inline-flex items-center gap-1 text-label text-muted">
            <CalendarClock size={14} strokeWidth={1.9} /> Reminder set for March
          </span>
        ) : null}
      </div>
    </article>
  );
}
