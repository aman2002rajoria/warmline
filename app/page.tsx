import Link from "next/link";
import { ArrowRight, BellRing, CalendarClock, Check, CircleAlert, Reply as ReplyIcon } from "lucide-react";
import { listProfessors } from "@/lib/professors-store";
import { readAllLogs } from "@/lib/logs-store";
import { getSetupStatus } from "@/lib/setup-status";
import { fmtAgo, plural } from "@/lib/format";
import { Card, CardHeader, Eyebrow } from "@/components/ui/card";
import { Kpi } from "@/components/ui/kpi";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TryTestData } from "@/components/test-mode";
import { isTestMode } from "@/lib/test-mode";
import { Funnel, Ring, WeekBars } from "@/components/charts";
import { ChannelBadge } from "@/components/channel";
import { REPLIES } from "@/lib/demo-people";
import { Avatar } from "@/components/professors/draft-panel";

export const dynamic = "force-dynamic";

const day = (d: Date) => d.toLocaleDateString("en-IN", { weekday: "short" });
const at = (iso: string) => new Date(iso).toLocaleString("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit" });

export default function OverviewPage() {
  const people = listProfessors();
  const setup = getSetupStatus();
  const logs = readAllLogs();

  const count = (s: string) => people.filter((p) => p.status === s).length;
  const total = people.length;
  const pending = count("pending");
  const drafted = count("drafted");
  const approved = count("approved");
  const sent = count("sent");
  const failed = count("failed");
  const sentNames = new Set(people.filter((p) => p.status === "sent").map((p) => p.professorName));
  const replies = isTestMode() ? REPLIES.filter((r) => sentNames.has(r.who)) : [];
  const interested = replies.filter((r) => r.lane === "interested").length;
  const replyRate = sent ? replies.length / sent : 0;

  // The week: 6 days back, today, and what's scheduled for tomorrow.
  const now = new Date();
  const days = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i - 6);
    const key = d.toDateString();
    const sentThat = logs.filter((l) => l.status === "sent" && new Date(l.timestamp).toDateString() === key).length;
    const sched = people.filter((p) => p.status === "approved" && p.scheduledAt && new Date(p.scheduledAt).toDateString() === key).length;
    return { label: i === 6 ? "Today" : day(d), sent: sentThat, scheduled: sched, today: i === 6 };
  });
  const sentThisWeek = days.reduce((a, d) => a + d.sent, 0);

  const upcoming = [
    ...people.filter((p) => p.status === "approved" && p.scheduledAt).map((p) => ({ p, kind: "send" as const, t: p.scheduledAt! })),
    ...people
      .filter((p) => p.status === "sent" && p.followUpAt && !p.followUpSent && !replies.some((r) => r.who === p.professorName))
      .map((p) => ({ p, kind: "follow" as const, t: p.followUpAt! })),
  ].sort((a, b) => a.t.localeCompare(b.t));

  const next = nextStep({ setupReady: setup.ready, total, pending, drafted, approved, failed });

  return (
    <>
      {/* Title on the left; the approve envelope and this week's numbers fill the right */}
      <div className="mb-8 grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <Eyebrow className="text-accent-600">Overview</Eyebrow>
          <h1 className="mt-2 text-h1 text-ink">Your outreach so far</h1>
          <p className="mt-3 max-w-[56ch] text-body-l text-muted">
            Personal emails to the people you want to reach, written with you and sent from your own Gmail.
          </p>
        </div>
        <div className="relative hidden h-[190px] w-[360px] md:block" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/W3-approve.webp" alt="" width={190} height={190} className="absolute left-1/2 top-1/2 h-[190px] w-auto -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_22px_30px_rgba(47,107,255,.35)]" />
          <span className="card absolute left-0 top-6 rounded-full px-3.5 py-2 text-body-s font-extrabold text-ink">
            <span className="text-accent-600">{replies.length}</span> replies this week
          </span>
          <span className="card absolute bottom-6 right-0 rounded-full px-3.5 py-2 text-body-s font-extrabold text-ink">
            <span className="text-accent-600">{upcoming.length}</span> coming up
          </span>
          <span className="card absolute bottom-2 left-6 rounded-full px-3.5 py-2 text-body-s font-extrabold text-ink">
            0 sent without your click
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi index={0} label="People" value={total} sub={total ? "in your list" : "import a sheet to start"} />
        <Kpi index={1} label="To review" value={drafted} sub={drafted ? "drafts waiting for your read" : "nothing waiting on you"} />
        <Kpi index={2} label="Sent" value={sent} accent sub={sentThisWeek ? `${sentThisWeek} in the last 7 days` : "none in the last 7 days"} />
        <Kpi index={3} label="Replies" value={replies.length} sub={interested ? `${interested} interested` : "none yet"} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-12">
        {/* Next step: a blue tile, like the portfolio's bands */}
        <section className="rise relative overflow-hidden rounded-l bg-accent-500 p-6 text-white shadow-flat md:col-span-7" style={{ "--i": 4 } as React.CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/plane.webp" alt="" width={180} height={168} className="pointer-events-none absolute bottom-6 right-6 hidden h-[150px] w-auto drop-shadow-[0_22px_26px_rgba(4,12,48,.5)] sm:block" />
          <div className="sm:pr-[180px]">
            <div className="text-label font-extrabold uppercase tracking-[.08em] text-white/80">Next step</div>
            <h2 className="mt-3 max-w-[26ch] text-h2 text-white">{next.title}</h2>
            <p className="mt-3 max-w-[52ch] text-body text-white/90">{next.text}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={next.href} className="!bg-white !text-[#1A3FA8] !shadow-[0_4px_0_rgba(4,12,48,.35)]">
                {next.cta} <ArrowRight size={20} strokeWidth={1.75} />
              </ButtonLink>
              {total === 0 && !isTestMode() ? <TryTestData /> : null}
            </div>
          </div>
        </section>

        <Card index={5} className="md:col-span-5">
          <Ring value={replyRate} label="Reply rate" sub={sent ? `${replies.length} of ${sent} people wrote back` : "Send a few to see it"} />
          <div className="mt-5 border-t border-line pt-4">
            <Funnel
              steps={[
                { label: "On your list", value: total },
                { label: "Drafted", value: total - pending },
                { label: "Sent", value: sent },
                { label: "Replied", value: replies.length },
                { label: "Interested", value: interested },
              ]}
            />
          </div>
        </Card>

        <Card index={6} className="md:col-span-7">
          <CardHeader title="This week" sub="Emails sent each day, and what's scheduled next." />
          <WeekBars days={days} />
        </Card>

        <Card index={7} className="md:col-span-5">
          <CardHeader title="Coming up" right={<Link href="/people?filter=scheduled" className="link text-body-s">See all</Link>} />
          {upcoming.length ? (
            <ul className="flex flex-col gap-2">
              {upcoming.slice(0, 4).map(({ p, kind, t }) => (
                <li key={p.id + kind}>
                  <Link href="/people" className="flex items-center gap-3 rounded-m bg-surface p-3 transition-colors hover:bg-accent-50">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${kind === "send" ? "bg-accent-500 text-white" : "bg-warning-tint text-warning-text"}`}>
                      {kind === "send" ? <CalendarClock size={17} strokeWidth={1.9} /> : <BellRing size={17} strokeWidth={1.9} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-extrabold text-ink">{p.professorName}</div>
                      <div className="truncate text-body-s text-muted">{kind === "send" ? "Scheduled send" : "Follow-up if no reply"}</div>
                    </div>
                    <span className="shrink-0 text-label font-semibold text-ink-2">{at(t)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-s text-muted">Nothing scheduled. Schedule a send from any approved draft.</p>
          )}
        </Card>

        <Card index={8} className="md:col-span-7">
          <CardHeader
            title="Latest replies"
            right={<Link href="/replies" className="link inline-flex items-center gap-1 text-body-s">Open replies <ArrowRight size={16} strokeWidth={1.75} /></Link>}
          />
          {replies.length ? (
            <ul className="-mx-2">
              {replies.slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-s px-2 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-line">
                  <Avatar name={r.who} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-extrabold text-ink">{r.who}</span>
                      <ChannelBadge channel={r.channel} />
                    </div>
                    <p className="truncate text-body-s text-muted">&ldquo;{r.text}&rdquo;</p>
                  </div>
                  <Chip tone={r.lane === "interested" ? "success" : r.lane === "later" ? "warning" : "neutral"} className="hidden sm:inline-flex">
                    {r.lane === "interested" ? "Interested" : r.lane === "later" ? "Later" : "Not now"}
                  </Chip>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-body-s text-muted"><ReplyIcon size={16} strokeWidth={1.9} /> Replies land here, sorted, with an answer ready.</p>
          )}
        </Card>

        <Card index={9} className="md:col-span-5">
          <CardHeader title="Setup" right={setup.ready ? <Chip tone="success">Ready</Chip> : <Chip tone="warning">{setup.toFix} to fix</Chip>} />
          <ul className="flex flex-col gap-3.5">
            {setup.items.map((it) => (
              <li key={it.key} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${it.ok ? "bg-success-tint text-success-text" : "bg-warning-tint text-warning-text"}`}>
                  {it.ok ? <Check size={14} strokeWidth={2.5} /> : <CircleAlert size={14} strokeWidth={2} />}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-ink">{it.label}</div>
                  <div className="truncate text-body-s text-muted">{it.detail}</div>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/settings" className="link mt-5 inline-flex items-center gap-1 text-body-s">
            Open settings <ArrowRight size={16} strokeWidth={1.75} />
          </Link>
        </Card>
      </div>
      <p className="mt-4 text-label text-faint">{logs.length ? `Last activity ${fmtAgo(logs[0].timestamp)}.` : ""}</p>
    </>
  );
}

function nextStep(s: {
  setupReady: boolean;
  total: number;
  pending: number;
  drafted: number;
  approved: number;
  failed: number;
}) {
  if (!s.setupReady) {
    return {
      title: "Finish setup before your first send",
      text: "Warmline needs a Gemini key to write the personal lines, a Gmail app password to send, and a template with no placeholders left. An attachment is optional.",
      cta: "Open settings",
      href: "/settings",
    };
  }
  if (s.total === 0) {
    return {
      title: "Add the people you want to write to",
      text: "Import a sheet with name, company and email. What they work on, or a note about each one, gives Gemini something real to mention.",
      cta: "Import a sheet",
      href: "/people?import=1",
    };
  }
  if (s.drafted > 0) {
    return {
      title: `${plural(s.drafted, "draft")} ${s.drafted === 1 ? "is" : "are"} ready for your review`,
      text: "Read each one, fix anything that sounds off, then approve it or send it straight away.",
      cta: "Review drafts",
      href: "/people?filter=drafted",
    };
  }
  if (s.approved > 0) {
    return {
      title: `${plural(s.approved, "approved email")} ${s.approved === 1 ? "is" : "are"} ready to send`,
      text: "They go out one at a time from your Gmail, a few seconds apart.",
      cta: "Send approved",
      href: "/people?filter=approved",
    };
  }
  if (s.pending > 0) {
    return {
      title: `${plural(s.pending, "person", "people")} ${s.pending === 1 ? "doesn't" : "don't"} have a draft yet`,
      text: "Gemini writes two or three lines about what each person works on. The rest is your own template.",
      cta: "Write drafts",
      href: "/people?filter=pending",
    };
  }
  if (s.failed > 0) {
    return {
      title: `${plural(s.failed, "email")} didn't go through`,
      text: "Check the reason on each one, fix it, and send again.",
      cta: "See failed",
      href: "/people?filter=failed",
    };
  }
  return {
    title: "Everything in your list has been sent",
    text: "Import another sheet when you're ready for the next batch.",
    cta: "Import a sheet",
    href: "/people?import=1",
  };
}
