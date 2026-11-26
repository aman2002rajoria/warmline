"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Briefcase, Building2, Check, KeyRound, Link2, PenLine, RefreshCw, Send, Sparkles, StickyNote, Target } from "lucide-react";
import Link from "next/link";
import { getOwnKey } from "@/lib/own-key";
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

/** Faces for the test people (from the Warmline illustrations); everyone else gets an initial. */
const FACES: Record<string, string> = { "Priya Menon": "/art/P-priya.webp", "Kabir Shah": "/art/P-kabir.webp", "Meera Iyer": "/art/P-meera.webp", "Rohan Das": "/art/P-rohan.webp" };
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
  useEffect(() => {
    const read = () => setHasKey(Boolean(getOwnKey()));
    read();
    window.addEventListener("warmline-key", read);
    return () => window.removeEventListener("warmline-key", read);
  }, []);

  const first = p.professorName.split(" ")[0];
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
          <p className="mt-0.5 truncate text-body-s text-muted">
            {[p.department, p.university].filter(Boolean).join(" · ")} · {p.email}
          </p>
        </div>
        {hasDraft && !isSent ? (
          busy === "sending" ? (
            <Working>Sending from your Gmail</Working>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
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
          <div className="rounded-m bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <Eyebrow className="text-muted">What it read</Eyebrow>
              {thin ? <Chip tone="warning">Little to go on</Chip> : null}
            </div>
            {details.length ? (
              <ul className="mt-3 flex flex-col gap-2.5">
                {details.map((d) => (
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
                <Textarea className="mt-3 bg-white" rows={5} value={lines} onChange={(e) => setLines(e.target.value)} aria-label="Personal lines" autoFocus />
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
                    <div className="mt-1 font-semibold text-ink">{subject}</div>
                  </div>
                  <div className="whitespace-pre-wrap pt-3 text-[15px] leading-relaxed text-ink-2">
                    <Highlighted body={body} lines={lines} />
                  </div>
                </div>
              )}
              <p className="mt-3 text-label text-muted">
                {isSent ? `Sent ${fmtDateTime(p.sentAt)} from ${sender || "your Gmail"}.` : "Nothing goes out without your click."}
              </p>
            </>
          )}
        </div>
      </div>

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
