import Link from "next/link";
import { ArrowRight, Check, CircleAlert } from "lucide-react";
import { listProfessors } from "@/lib/professors-store";
import { readAllLogs } from "@/lib/logs-store";
import { getSetupStatus } from "@/lib/setup-status";
import { fmtAgo, plural } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, Eyebrow } from "@/components/ui/card";
import { Kpi } from "@/components/ui/kpi";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/feedback";
import { TryTestData } from "@/components/test-mode";
import { isTestMode } from "@/lib/test-mode";

export const dynamic = "force-dynamic";

export default function OverviewPage() {
  const professors = listProfessors();
  const setup = getSetupStatus();
  const logs = readAllLogs().slice(0, 6);

  const count = (s: string) => professors.filter((p) => p.status === s).length;
  const total = professors.length;
  const pending = count("pending");
  const drafted = count("drafted");
  const approved = count("approved");
  const sent = count("sent");
  const failed = count("failed");
  const weekAgo = Date.now() - 7 * 86400_000;
  const sentThisWeek = professors.filter(
    (p) => p.sentAt && new Date(p.sentAt).getTime() > weekAgo,
  ).length;

  const next = nextStep({ setupReady: setup.ready, total, pending, drafted, approved, failed });

  return (
    <>
      <PageHeader
        title="Your outreach so far"
        sub="Personal emails to the people you want to reach, written with you and sent from your own Gmail."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi index={0} label="People" value={total} sub={total ? "in your list" : "import a sheet to start"} />
        <Kpi
          index={1}
          label="To review"
          value={drafted}
          sub={drafted ? "drafts waiting for your read" : "nothing waiting on you"}
        />
        <Kpi
          index={2}
          label="Sent"
          value={sent}
          accent
          sub={sentThisWeek ? `${sentThisWeek} in the last 7 days` : "none in the last 7 days"}
        />
        <Kpi
          index={3}
          label="Failed"
          value={failed}
          sub={failed ? "retry from People" : "every send went through"}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-12">
        <Card index={4} tint className="relative flex flex-col justify-between overflow-hidden md:col-span-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/W3-approve.webp" alt="" width={190} height={190} className="pointer-events-none absolute bottom-4 right-6 hidden h-[190px] w-auto drop-shadow-[0_18px_24px_rgba(47,107,255,.25)] md:block" />
          <div className="md:pr-[210px]">
            <Eyebrow className="text-accent-700">Next step</Eyebrow>
            <h2 className="mt-3 max-w-[30ch] text-h2 text-accent-900">{next.title}</h2>
            <p className="mt-3 max-w-[60ch] text-body text-ink-2">{next.text}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={next.href} variant="primary">
              {next.cta} <ArrowRight size={20} strokeWidth={1.75} />
            </ButtonLink>
            {total === 0 && !isTestMode() ? <TryTestData /> : null}
          </div>
        </Card>

        <Card index={5} className="md:col-span-4">
          <CardHeader
            title="Setup"
            right={
              setup.ready ? (
                <Chip tone="success">Ready</Chip>
              ) : (
                <Chip tone="warning">{setup.toFix} to fix</Chip>
              )
            }
          />
          <ul className="flex flex-col gap-4">
            {setup.items.map((it) => (
              <li key={it.key} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    it.ok ? "bg-success-tint text-success-text" : "bg-warning-tint text-warning-text"
                  }`}
                >
                  {it.ok ? (
                    <Check size={14} strokeWidth={2.5} />
                  ) : (
                    <CircleAlert size={14} strokeWidth={2} />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-ink">{it.label}</div>
                  <div className="truncate text-body-s text-muted">{it.detail}</div>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/settings" className="link mt-6 inline-flex items-center gap-1 text-body-s">
            Open settings <ArrowRight size={16} strokeWidth={1.75} />
          </Link>
        </Card>
      </div>

      <Card index={6} className="mt-4">
        <CardHeader
          title="Recent sends"
          right={
            logs.length ? (
              <Link href="/logs" className="link inline-flex items-center gap-1 text-body-s">
                See history <ArrowRight size={16} strokeWidth={1.75} />
              </Link>
            ) : null
          }
        />
        {logs.length === 0 ? (
          <EmptyState
            object="envelope"
            title="Your sent emails will show up here"
            text="Each send is logged with the time and subject, and any failure with its reason."
            className="py-4"
          />
        ) : (
          <ul className="-mx-2">
            {logs.map((l, i) => (
              <li
                key={`${l.timestamp}-${i}`}
                className="flex items-center gap-4 rounded-s px-2 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-line"
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${l.status === "sent" ? "bg-success" : "bg-danger"}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{l.professorName}</div>
                  <div className="truncate text-body-s text-muted">
                    {l.status === "sent" ? l.subject : l.errorMessage}
                  </div>
                </div>
                <Chip tone={l.status === "sent" ? "success" : "danger"} className="hidden sm:inline-flex">
                  {l.status === "sent" ? "Sent" : "Failed"}
                </Chip>
                <span className="w-20 shrink-0 text-right text-body-s text-muted tabular">
                  {fmtAgo(l.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
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
