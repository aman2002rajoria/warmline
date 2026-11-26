"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, BellRing, Briefcase, Building2, CalendarClock, Check, FileText, Globe, KeyRound, Link2, Linkedin, MessageSquare, Mic, Newspaper, Paperclip, PenLine, Presentation, RefreshCw, Reply as ReplyIcon, Send, Sparkles, StickyNote, Target, Twitter, X } from "lucide-react";
import { byName, CHANNEL_LABEL, FACES, followUpText, REPLIES, type ActivityKind } from "@/lib/demo-people";
import Link from "next/link";
import { getOwnKey } from "@/lib/own-key";
import { DEFAULT_PROFILE, getProfile, type Profile } from "@/lib/profile";
import { getShared, type Shared } from "@/components/shared-attachment";
import { SignatureCard } from "@/components/signature-card";
import { toast } from "sonner";
import type { ProfessorRecord } from "@/types";
import { fmtDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/card";
import { Badge, Chip, StatusChip } from "@/components/ui/chip";
import { Input, Textarea } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Working } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { api } from "./api";

type Busy = null | "writing" | "rewriting" | "applying" | "approving" | "sending";

const di = { size: 16, strokeWidth: 1.9 } as const;
/** What Gemini is given about a person, in the order the prompt lists it. */
function detailsOf(p: ProfessorRecord) {
  return [
    { label: "Works on", value: p.researchArea, icon: <Target {...di} /> },
    { label: "Role", value: p.department, icon: <Briefcase {...di} /> },
    { label: "Company", value: p.university, icon: <Building2 {...di} /> },
    { label: "Link", value: p.labWebsite, icon: <Link2 {...di} /> },
    { label: "Your notes", value: p.notes, icon: <StickyNote {...di} /> },
  ].filter((d): d is { label: string; value: string; icon: JSX.Element } => Boolean(d.value));
}

const KIND_ICON: Record<ActivityKind, JSX.Element> = {
  talk: <Presentation {...di} />, post: <MessageSquare {...di} />, article: <FileText {...di} />, news: <Newspaper {...di} />, podcast: <Mic {...di} />,
};
const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";
export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const src = FACES[name];
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} style={{ width: size, height: size }} className="shrink-0 rounded-full" />
  ) : (
    <span style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-full bg-accent-100 text-[15px] font-black text-accent-700">
      {name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
    </span>
  );
}

export function DraftPanel({
  p,
  sender,
  testMode,
  disabled,
  onUpdated,
  onRefresh,
}: {
  p: ProfessorRecord;
  sender: string;
  testMode: boolean;
  disabled: boolean;
  onUpdated: (p: ProfessorRecord) => void;
  onRefresh: () => Promise<void>;
}) {
  const [lines, setLines] = useState(p.personalizedLines || "");
  const [subject, setSubject] = useState(p.finalSubject || "");
  const [body, setBody] = useState(p.finalBody || "");
  const [editingLines, setEditingLines] = useState(false);
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [why, setWhy] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmSend, setConfirmSend] = useState(false);

  const details = detailsOf(p);
  const hasDraft = Boolean(p.finalBody);
  const isSent = p.status === "sent";
  const dirty =
    subject !== (p.finalSubject || "") ||
    body !== (p.finalBody || "") ||
    lines !== (p.personalizedLines || "");
  const thin = !p.researchArea && !p.notes;
  const locked = disabled || busy !== null;

  async function run(kind: Busy, fn: () => Promise<ProfessorRecord | void>, ok?: string) {
    setBusy(kind);
    try {
      const updated = await fn();
      if (ok) toast.success(ok);
      if (updated) onUpdated(updated);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(null);
    }
  }

  const writeDraft = (rewrite: boolean) =>
    run(rewrite ? "rewriting" : "writing", () => api.writeDraft(p.id, rewrite));

  const applyLines = () =>
    run(
      "applying",
      async () => {
        await api.update(p.id, { personalizedLines: lines });
        return api.rebuild(p.id);
      },
      "Email updated with your lines.",
    );

  const approve = () =>
    run(
      "approving",
      () =>
        api.update(p.id, {
          personalizedLines: lines,
          finalSubject: subject,
          finalBody: body,
          status: "approved",
          approved: true,
        }),
      "Approved. It goes out with your next bulk send.",
    );

  async function send() {
    setConfirmSend(false);
    setBusy("sending");
    try {
      await api.update(p.id, {
        personalizedLines: lines,
        finalSubject: subject,
        finalBody: body,
        status: "approved",
        approved: true,
      });
      const res = await api.send([p.id]);
      if (res.sent > 0)
        toast.success(
          testMode
            ? `Test mode: marked as sent to ${p.professorName}. Nothing was emailed.`
            : `Sent to ${p.professorName}.`,
        );
      else toast.error(res.details[0]?.error || "That email didn't go out.");
    } catch (err) {
      toast.error((err as Error).message);
    }
    await onRefresh();
    setBusy(null);
  }

  const [hasKey, setHasKey] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [shared, setSharedFile] = useState<Shared>(null);
  useEffect(() => {
    const read = () => { setHasKey(Boolean(getOwnKey())); setProfile(getProfile()); setSharedFile(getShared()); };
    read();
    const evs = ["warmline-key", "warmline-profile", "warmline-shared"];
    evs.forEach((e) => window.addEventListener(e, read));
    return () => evs.forEach((e) => window.removeEventListener(e, read));
  }, []);

  const first = p.professorName.split(" ")[0];
  const extra = byName(p.professorName);
  const links = { ...(extra?.links ?? {}), ...(p.labWebsite && !extra?.links.website ? { website: p.labWebsite } : {}) };
  const activity = extra?.activity ?? [];
  const hook = activity.find((a) => a.hook);
  const reply = REPLIES.find((r) => r.who === p.professorName);
  const scheduled = p.status === "approved" && p.scheduledAt ? p.scheduledAt : null;
  const followDue = p.status === "sent" && !reply && p.followUpAt && !p.followUpSent ? p.followUpAt : null;

  // Scheduling: approved drafts can wait for a chosen time.
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const schedule = (iso: string | null) =>
    run(
      "approving",
      () =>
        api.update(p.id, {
          personalizedLines: lines, finalSubject: subject, finalBody: body,
          status: "approved", approved: true, scheduledAt: iso,
        }),
      iso ? `Scheduled for ${when(iso)}.${testMode ? " Test mode: nothing will be emailed." : ""}` : "Unscheduled. It's approved and waiting.",
    ).then(() => setScheduleOpen(false));
  const soon = (() => {
    const d = new Date();
    const at = (days: number, h: number, m = 0) => { const x = new Date(d); x.setDate(x.getDate() + days); x.setHours(h, m, 0, 0); return x.toISOString(); };
    const mon = (8 - d.getDay()) % 7 || 7;
    return [
      { label: "In 2 hours", iso: new Date(Date.now() + 2 * 3600_000).toISOString() },
      { label: "Tomorrow, 9:30 am", iso: at(1, 9, 30) },
      { label: "Monday, 10 am", iso: at(mon, 10) },
    ];
  })();

  // Attachments for this one email.
  const files = p.attachments ?? [];
  const setFiles = (next: { name: string; size: number }[], msg: string) => run("applying", () => api.update(p.id, { attachments: next }), msg);

  // Follow-up for someone who hasn't replied.
  const nudge = followUpText(first, hook?.text ?? p.researchArea ?? null);
  const canSend = !locked && Boolean(subject.trim()) && Boolean(body.trim());

  return (
    <section
      className="card rise flex flex-col overflow-hidden rounded-l md:h-full"
      aria-label={`Draft for ${p.professorName}`}
    >
      {/* Who, and what to do: always in view */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-5 py-4 md:px-6">
        <Avatar name={p.professorName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-h3 text-ink">{p.professorName}</h2>
            <StatusChip status={p.status} />
          </div>
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <p className="truncate text-body-s text-muted">
              {[p.department, p.university].filter(Boolean).join(" · ")} · {p.email}
            </p>
            {links.linkedin || links.x || links.website ? (
              <span className="flex shrink-0 items-center gap-1">
                {links.linkedin ? <Social href={links.linkedin} label={`${first} on LinkedIn`}><Linkedin size={14} strokeWidth={1.9} /></Social> : null}
                {links.x ? <Social href={links.x} label={`${first} on X`}><Twitter size={14} strokeWidth={1.9} /></Social> : null}
                {links.website ? <Social href={links.website} label={`${first}'s website`}><Globe size={14} strokeWidth={1.9} /></Social> : null}
              </span>
            ) : null}
          </div>
        </div>
        {hasDraft && !isSent ? (
          busy === "sending" ? (
            <Working>Sending from your Gmail</Working>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {scheduled ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1.5 text-label font-semibold text-accent-700">
                  <CalendarClock size={14} strokeWidth={1.9} /> {when(scheduled)}
                  <button type="button" onClick={() => schedule(null)} aria-label="Unschedule" className="ml-0.5 rounded-full p-0.5 hover:bg-accent-100" disabled={locked}>
                    <X size={13} strokeWidth={2} />
                  </button>
                </span>
              ) : null}
              <Button size="sm" variant="ghost" onClick={() => setScheduleOpen(true)} disabled={!canSend}>
                <CalendarClock size={16} strokeWidth={1.9} /> {scheduled ? "Reschedule" : "Schedule"}
              </Button>
              {p.status !== "approved" || dirty ? (
                <Button size="sm" variant="ghost" onClick={approve} disabled={locked}>
                  <Check size={16} strokeWidth={1.9} />
                  {p.status === "approved" ? "Save changes" : "Approve for later"}
                </Button>
              ) : null}
              <Button size="sm" variant="primary" onClick={() => setConfirmSend(true)} disabled={!canSend}>
                <Send size={16} strokeWidth={1.9} />
                {p.status === "failed" ? "Send again" : "Approve & send"}
              </Button>
            </div>
          )
        ) : null}
      </header>

      <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 md:p-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        {/* Left: what it read, and the AI's lines */}
        <div className="flex min-w-0 flex-col gap-4">
          {activity.length ? (
            <div className="rounded-m bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <Eyebrow className="text-muted">Why this line</Eyebrow>
                <span className="text-label text-faint">{activity.length} recent</span>
              </div>
              <ol className="relative mt-3 flex flex-col gap-2 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-line">
                {activity.map((a) => (
                  <li key={a.text} className={`relative flex gap-3 rounded-s p-2 ${a.hook ? "bg-accent-50 ring-1 ring-accent-200" : ""}`}>
                    <span className={`relative z-[1] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full ${a.hook ? "bg-accent-500 text-white" : "bg-card text-ink-2 shadow-flat"}`}>
                      {KIND_ICON[a.kind]}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 text-label text-muted">
                        <span className="font-semibold text-ink-2">{a.source}</span>
                        <span>{a.when}</span>
                      </div>
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noreferrer" className="mt-0.5 block text-body-s leading-snug text-ink hover:text-accent-700">
                          {a.text} <ArrowUpRight size={12} strokeWidth={2} className="inline" />
                        </a>
                      ) : (
                        <p className="mt-0.5 text-body-s leading-snug text-ink">{a.text}</p>
                      )}
                      {a.hook ? (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-accent-500 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[.05em] text-white">
                          <Sparkles size={11} strokeWidth={2.2} /> Used for the hook
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {p.status === "failed" && p.errorMessage ? (
            <div className="rounded-m bg-danger-tint p-4">
              <div className="font-extrabold text-danger-text">This email didn&rsquo;t go out</div>
              <p className="mt-1 break-words text-body-s text-danger-text">{p.errorMessage}</p>
            </div>
          ) : null}

          {hasDraft ? (
            <div className="rounded-m bg-accent-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles size={15} strokeWidth={2} className="text-accent-700" />
                <Eyebrow className="text-accent-700">Personal lines</Eyebrow>
                <Badge>AI</Badge>
              </div>
              {busy === "rewriting" ? (
                <Working className="mt-3">Rewriting from {first}&rsquo;s details</Working>
              ) : editingLines ? (
                <Textarea className="mt-3 bg-card" rows={5} value={lines} onChange={(e) => setLines(e.target.value)} aria-label="Personal lines" autoFocus />
              ) : (
                <p className="mt-2 text-body-s leading-relaxed text-ink">{lines || <span className="text-muted">Empty. Rewrite or type your own.</span>}</p>
              )}
              {why ? (
                <p className="mt-3 text-label leading-relaxed text-accent-900">
                  Gemini read the name and {details.map((d) => d.label.toLowerCase()).join(", ") || "company"}, and wrote these lines to sit right after your greeting. It can&rsquo;t open links, so check every claim is true before you send.
                </p>
              ) : null}
              {!isSent ? (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {editingLines ? (
                    <>
                      <Button size="sm" onClick={applyLines} disabled={locked || !lines.trim()}>
                        <Check size={15} strokeWidth={1.9} /> Use in email
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setLines(p.personalizedLines || ""); setEditingLines(false); }}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => writeDraft(true)} disabled={locked}>
                        <RefreshCw size={15} strokeWidth={1.9} /> Rewrite
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingLines(true)} disabled={locked}>
                        <PenLine size={15} strokeWidth={1.9} /> Edit
                      </Button>
                    </>
                  )}
                  <button type="button" className="link ml-1 text-label" onClick={() => setWhy((w) => !w)}>
                    {why ? "Hide" : "Why this?"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="rounded-m bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <Eyebrow className="text-muted">{activity.length ? "From your sheet" : "What it read"}</Eyebrow>
              {thin && !activity.length ? <Chip tone="warning">Little to go on</Chip> : null}
            </div>
            {details.length ? (
              <ul className="mt-3 flex flex-col gap-2.5">
                {details.filter((d) => !activity.length || d.label !== "Link").map((d) => (
                  <li key={d.label} className="flex gap-2.5">
                    <span className="mt-0.5 text-accent-600">{d.icon}</span>
                    <div className="min-w-0">
                      <div className="text-label text-muted">{d.label}</div>
                      {d.label === "Link" ? (
                        <a href={d.value.startsWith("http") ? d.value : `https://${d.value}`} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-0.5 break-all text-body-s">
                          {d.value} <ArrowUpRight size={14} strokeWidth={1.75} />
                        </a>
                      ) : (
                        <div className="break-words text-body-s text-ink-2">{d.value}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-body-s text-ink-2">Only a name and company. Add what they work on, or a note, so the lines can say something specific.</p>
            )}
          </div>

        </div>

        {/* Right: the email itself, or the empty state */}
        <div className="flex min-w-0 flex-col">
          {!hasDraft ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-m bg-surface px-6 py-10 text-center">
              {busy === "writing" ? (
                <Working>Reading what {first} works on</Working>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/art/F2-draft.webp" alt="" width={120} height={120} className="h-[120px] w-auto drop-shadow-[0_14px_18px_rgba(47,107,255,.22)]" />
                  <div>
                    <h3 className="text-h3 text-ink">No draft yet</h3>
                    <p className="mx-auto mt-1 max-w-[46ch] text-body-s text-muted">
                      Gemini writes two or three lines from what it read. The rest is your own template, so it still sounds like you.
                    </p>
                  </div>
                  <Button variant="primary" onClick={() => writeDraft(false)} disabled={locked}>
                    <PenLine size={18} strokeWidth={1.9} /> Write draft
                  </Button>
                  <p className="inline-flex items-center gap-1.5 text-label text-muted">
                    <KeyRound size={14} strokeWidth={1.9} />
                    {hasKey ? "Using your own Gemini key." : <>Test lines for now. <Link href="/settings" className="link">Add your Gemini key</Link> for real ones.</>}
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between gap-3">
                <Eyebrow className="text-muted">The email</Eyebrow>
                {!isSent ? (
                  <Segmented
                    label="Email view"
                    value={mode}
                    onChange={setMode}
                    options={[
                      { value: "preview", label: "Preview" },
                      { value: "edit", label: "Edit" },
                    ]}
                  />
                ) : null}
              </div>
              {mode === "edit" && !isSent ? (
                <div className="flex flex-col gap-3">
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" placeholder="Subject" />
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} aria-label="Email body" className="text-[15px] leading-relaxed" />
                </div>
              ) : (
                <div className="rounded-m bg-surface p-5">
                  <div className="border-b border-line pb-3">
                    <div className="text-label text-muted">To {p.email}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{subject}</span>
                      <Badge>AI subject</Badge>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap pt-3 text-[15px] leading-relaxed text-ink-2">
                    <Highlighted body={body} lines={lines} />
                  </div>
                  {profile.signature ? <div className="mt-4"><SignatureCard p={profile} compact /></div> : null}
                </div>
              )}
              {/* Attachments for this email */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-label text-muted"><Paperclip size={14} strokeWidth={1.9} /> Attachments</span>
                {shared ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-label text-accent-700" title="Shared with every email (Settings)">
                    <FileText size={13} strokeWidth={1.9} /> {shared.name} <span className="opacity-70">every email</span>
                  </span>
                ) : null}
                {files.map((f) => (
                  <span key={f.name} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-label text-ink-2">
                    <FileText size={13} strokeWidth={1.9} /> {f.name} <span className="text-faint">{Math.max(1, Math.round(f.size / 1024))} KB</span>
                    {!isSent ? (
                      <button type="button" aria-label={`Remove ${f.name}`} className="rounded-full p-0.5 hover:bg-surface-2" disabled={locked}
                        onClick={() => setFiles(files.filter((x) => x.name !== f.name), "Attachment removed.")}>
                        <X size={12} strokeWidth={2} />
                      </button>
                    ) : null}
                  </span>
                ))}
                {!isSent ? (
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-1 text-label font-semibold text-accent-600 hover:bg-accent-50">
                    + Attach a file
                    <input type="file" className="hidden" disabled={locked} onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFiles([...files.filter((x) => x.name !== f.name), { name: f.name, size: f.size }], testMode ? `${f.name} attached. Test mode: the file stays on your computer.` : `${f.name} attached.`);
                      e.target.value = "";
                    }} />
                  </label>
                ) : files.length ? null : <span className="text-label text-faint">None</span>}
              </div>

              {/* After sending: their reply, or a follow-up when they haven't answered */}
              {reply ? (
                <a href="/replies" className="mt-3 flex items-start gap-3 rounded-m bg-success-tint p-4 transition-colors hover:brightness-105">
                  <ReplyIcon size={18} strokeWidth={1.9} className="mt-0.5 shrink-0 text-success-text" />
                  <div className="min-w-0">
                    <div className="text-label font-extrabold text-success-text">Replied on {CHANNEL_LABEL[reply.channel]}</div>
                    <p className="mt-0.5 text-body-s text-ink">&ldquo;{reply.text}&rdquo;</p>
                    <span className="mt-1 inline-block text-label font-semibold text-accent-600">Answer it in Replies →</span>
                  </div>
                </a>
              ) : followDue ? (
                <div className="mt-3 rounded-m bg-warning-tint p-4">
                  <div className="flex items-center gap-2 text-label font-extrabold text-warning-text">
                    <BellRing size={15} strokeWidth={1.9} /> No reply yet · follow up {when(followDue)}
                  </div>
                  <p className="mt-1.5 text-body-s text-ink">{nudge}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Button size="sm" variant="primary" disabled={locked} onClick={() => run("sending", () => api.update(p.id, { followUpSent: true }), testMode ? `Test mode: follow-up to ${first} marked as sent. Nothing was emailed.` : `Follow-up sent to ${first}.`)}>
                      <Send size={15} strokeWidth={1.9} /> Send follow-up now
                    </Button>
                    <span className="self-center text-label text-muted">or leave it: it goes out on its own {when(followDue)}.</span>
                  </div>
                </div>
              ) : p.status === "sent" && p.followUpSent ? (
                <p className="mt-3 inline-flex items-center gap-1.5 text-label text-muted"><BellRing size={14} strokeWidth={1.9} /> Follow-up sent. Waiting on {first}.</p>
              ) : null}

              <p className="mt-3 text-label text-muted">
                {isSent ? `Sent ${fmtDateTime(p.sentAt)} from ${sender || "your Gmail"}.` : scheduled ? `Goes out ${when(scheduled)} from ${sender || "your Gmail"}.` : "Nothing goes out without your click."}
              </p>
            </>
          )}
        </div>
      </div>

      <Modal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        title={`Schedule the email to ${first}`}
        description="It's approved now and goes out from your Gmail at the time you pick."
        footer={
          <>
            <Button variant="ghost" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={!custom || locked} onClick={() => schedule(new Date(custom).toISOString())}>
              <CalendarClock size={18} strokeWidth={1.9} /> Schedule
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          {soon.map((o) => (
            <button key={o.label} type="button" disabled={locked} onClick={() => schedule(o.iso)}
              className="flex items-center justify-between rounded-m bg-surface px-4 py-3 text-left transition-colors hover:bg-accent-50">
              <span className="font-semibold text-ink">{o.label}</span>
              <span className="text-body-s text-muted">{when(o.iso)}</span>
            </button>
          ))}
          <label className="mt-2 flex flex-col gap-1.5 text-label text-muted">
            Or pick a time
            <Input type="datetime-local" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Send at" />
          </label>
        </div>
      </Modal>

      <Modal
        open={confirmSend}
        onOpenChange={setConfirmSend}
        title={`Send to ${first}?`}
        description={`It goes out now from ${sender || "your Gmail"}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmSend(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={send}>
              <Send size={18} strokeWidth={1.9} /> Send email
            </Button>
          </>
        }
      >
        <dl className="grid grid-cols-[72px_1fr] gap-x-4 gap-y-2 rounded-m bg-surface p-5 text-body-s">
          <dt className="text-muted">To</dt>
          <dd className="break-all text-ink">{p.email}</dd>
          <dt className="text-muted">Subject</dt>
          <dd className="text-ink">{subject}</dd>
        </dl>
      </Modal>
    </section>
  );
}

/** The draft body with the AI-written lines highlighted (§11.2). */
function Highlighted({ body, lines }: { body: string; lines: string }) {
  const i = lines ? body.indexOf(lines) : -1;
  if (i < 0) return <>{body}</>;
  return (
    <>
      {body.slice(0, i)}
      <mark className="rounded-s bg-accent-100 px-1 text-ink [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
        {lines}
      </mark>
      {body.slice(i + lines.length)}
    </>
  );
}

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-ink-2 transition-colors hover:bg-accent-50 hover:text-accent-700">
      {children}
    </a>
  );
}
