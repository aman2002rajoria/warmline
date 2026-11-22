"use client";

import { useState } from "react";
import { ArrowUpRight, Check, PenLine, RefreshCw, Send } from "lucide-react";
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

/** What Gemini is given about a professor, in the order the prompt lists it. */
function detailsOf(p: ProfessorRecord) {
  return [
    { label: "Research area", value: p.researchArea },
    { label: "Department", value: p.department },
    { label: "Lab website", value: p.labWebsite },
    { label: "Your notes", value: p.notes },
  ].filter((d): d is { label: string; value: string } => Boolean(d.value));
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
            ? `Sent to ${p.professorName} in test mode. Nothing left your computer.`
            : `Sent to ${p.professorName}.`,
        );
      else toast.error(res.details[0]?.error || "That email didn't go out.");
    } catch (err) {
      toast.error((err as Error).message);
    }
    await onRefresh();
    setBusy(null);
  }

  return (
    <section className="card rise rounded-l p-6 md:p-7" aria-label={`Draft for ${p.professorName}`}>
      {/* Who */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-h2 text-ink">{p.professorName}</h2>
          <p className="mt-2 text-body-s text-muted">
            {[p.department, p.university].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-s text-muted">
            <span>{p.email}</span>
            {p.labWebsite ? (
              <a
                href={p.labWebsite.startsWith("http") ? p.labWebsite : `https://${p.labWebsite}`}
                target="_blank"
                rel="noreferrer"
                className="link inline-flex items-center gap-0.5"
              >
                Lab website <ArrowUpRight size={16} strokeWidth={1.75} />
              </a>
            ) : null}
          </p>
        </div>
        <StatusChip status={p.status} />
      </div>

      {/* What Gemini reads */}
      <div className="mt-6 rounded-m bg-surface p-5">
        <Eyebrow className="text-muted">What Gemini reads</Eyebrow>
        {details.length ? (
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-[140px_1fr]">
            {details.map((d) => (
              <div key={d.label} className="contents">
                <dt className="text-label text-muted sm:pt-0.5">{d.label}</dt>
                <dd className="break-words text-body text-ink-2">{d.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-body text-ink-2">
            Only a name and university. Add a research area or a note in your sheet so the lines
            can say something specific.
          </p>
        )}
      </div>

      {p.status === "failed" && p.errorMessage ? (
        <div className="mt-4 rounded-m bg-danger-tint p-5">
          <div className="font-extrabold text-danger-text">This email didn&rsquo;t go out</div>
          <p className="mt-1 break-words text-body-s text-danger-text">{p.errorMessage}</p>
          <p className="mt-2 text-body-s text-ink-2">
            Fix the cause (often the Gmail app password in Settings), then send again below.
          </p>
        </div>
      ) : null}

      {!hasDraft ? (
        /* No draft yet */
        <div className="mt-6 flex flex-col items-start gap-4">
          {busy === "writing" ? (
            <Working>Reading {p.professorName}&rsquo;s research area and notes</Working>
          ) : (
            <>
              <div>
                <h3 className="text-h3 text-ink">No draft yet</h3>
                <p className="mt-1 max-w-[60ch] text-body text-muted">
                  Gemini writes two or three lines from the details above. Everything else comes
                  from your template.
                </p>
              </div>
              <Button variant="primary" onClick={() => writeDraft(false)} disabled={locked}>
                <PenLine size={20} strokeWidth={1.75} /> Write draft
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* The AI-written part */}
          <div className="mt-6 rounded-m bg-accent-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eyebrow className="text-accent-700">Personal lines</Eyebrow>
                <Badge>AI</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {thin ? <Chip tone="warning">Little to go on, check this</Chip> : null}
                <Chip tone="accent" className="bg-white">
                  Based on {details.length + 2} details
                </Chip>
              </div>
            </div>

            {busy === "rewriting" ? (
              <Working className="mt-4">Rewriting from {p.professorName}&rsquo;s details</Working>
            ) : editingLines ? (
              <Textarea
                className="mt-4 bg-white"
                rows={4}
                value={lines}
                onChange={(e) => setLines(e.target.value)}
                aria-label="Personal lines"
                autoFocus
              />
            ) : (
              <p className="mt-3 text-[17px] leading-relaxed text-ink">
                {lines || <span className="text-muted">Empty. Rewrite or type your own.</span>}
              </p>
            )}

            {why ? (
              <p className="mt-4 max-w-[64ch] text-body-s text-accent-900">
                Gemini read the name, university
                {details.length ? `, ${details.map((d) => d.label.toLowerCase()).join(", ")}` : ""} and
                wrote these lines to sit between your greeting and the rest of your template. It
                can&rsquo;t open websites or look up papers, so it stays general. Check every claim
                is true before you send.
              </p>
            ) : null}

            {!isSent ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {editingLines ? (
                  <>
                    <Button size="sm" onClick={applyLines} disabled={locked || !lines.trim()}>
                      <Check size={16} strokeWidth={1.75} /> Use in email
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setLines(p.personalizedLines || "");
                        setEditingLines(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => writeDraft(true)} disabled={locked}>
                      <RefreshCw size={16} strokeWidth={1.75} /> Rewrite
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingLines(true)} disabled={locked}>
                      <PenLine size={16} strokeWidth={1.75} /> Edit
                    </Button>
                  </>
                )}
                <button type="button" className="link text-body-s" onClick={() => setWhy((w) => !w)}>
                  {why ? "Hide" : "Why this?"}
                </button>
              </div>
            ) : null}
          </div>

          {/* The full email */}
          <div className="mt-6 flex items-center justify-between gap-3">
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
            <div className="mt-4 flex flex-col gap-3">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                aria-label="Subject"
                placeholder="Subject"
              />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={18}
                aria-label="Email body"
                className="text-[16px] leading-relaxed"
              />
            </div>
          ) : (
            <div className="mt-4 rounded-m bg-surface p-5 md:p-6">
              <div className="border-b border-line pb-4">
                <div className="text-label text-muted">Subject</div>
                <div className="mt-1 font-semibold text-ink">{subject}</div>
              </div>
              <div className="whitespace-pre-wrap pt-4 text-[16px] leading-relaxed text-ink-2">
                <Highlighted body={body} lines={lines} />
              </div>
              <div className="mt-4 border-t border-line pt-4 text-body-s text-muted">
                Your resume is attached as a PDF.
              </div>
            </div>
          )}

          {/* Actions */}
          {isSent ? (
            <p className="mt-6 text-body-s text-success-text">
              Sent {fmtDateTime(p.sentAt)} from {sender || "your Gmail"}.
            </p>
          ) : busy === "sending" ? (
            <Working className="mt-6">Sending from your Gmail</Working>
          ) : (
            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  onClick={() => setConfirmSend(true)}
                  disabled={locked || !subject.trim() || !body.trim()}
                >
                  <Send size={20} strokeWidth={1.75} />
                  {p.status === "failed" ? "Send again" : "Approve & send"}
                </Button>
                {p.status !== "approved" || dirty ? (
                  <Button variant="ghost" onClick={approve} disabled={locked}>
                    {p.status === "approved" ? "Save changes" : "Approve for later"}
                  </Button>
                ) : null}
              </div>
              <p className="mt-3 text-body-s text-muted">Nothing goes out without your click.</p>
            </div>
          )}
        </>
      )}

      <Modal
        open={confirmSend}
        onOpenChange={setConfirmSend}
        title={`Send to ${p.professorName}?`}
        description={`It goes out now from ${sender || "your Gmail"}, with your resume attached.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmSend(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={send}>
              Send email
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
