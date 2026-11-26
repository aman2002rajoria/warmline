"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, CircleAlert, FileText, Save } from "lucide-react";
import { toast } from "sonner";
import type { AppSettings, TestConfigResult } from "@/types";
import { cn } from "@/lib/utils";
import { findPlaceholders } from "@/lib/template";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Illustration, Working } from "@/components/ui/feedback";
import { OwnKeyCard } from "@/components/own-key-card";
import { TemplateLibrary } from "@/components/template-library";
import { SharedAttachmentCard } from "@/components/shared-attachment";
import { ProfileCard } from "@/components/profile-card";
import { GmailConnect } from "@/components/gmail-connect";


const TOKENS = ["{{first_name}}", "{{name}}", "{{company}}", "{{personalized_lines}}"];

export function SettingsClient({ initial, testMode }: { initial: AppSettings; testMode: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<AppSettings>(initial);
  const [saved, setSaved] = useState<AppSettings>(initial);
  const [newTemplate, setNewTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<TestConfigResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const placeholders = findPlaceholders(`${form.subjectTemplate}\n${form.bodyTemplate}`);
  const missingLines = !form.bodyTemplate.includes("{{personalized_lines}}");

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(quiet = false) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save settings.");
      setForm(data.settings);
      setSaved(data.settings);
      router.refresh();
      if (!quiet) toast.success("Settings saved.");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function runCheck() {
    if (dirty && !(await save(true))) return;
    setChecking(true);
    setCheck(null);
    setCheckError(null);
    try {
      const res = await fetch("/api/test-config", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The check didn't finish.");
      setCheck(data);
    } catch (err) {
      setCheckError((err as Error).message);
    } finally {
      setChecking(false);
    }
  }

  async function sendTest() {
    if (dirty && !(await save(true))) return;
    setTesting(true);
    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: testTo }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || "The test email didn't go out.");
      toast.success(`Test email sent to ${testTo}.`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setTesting(false);
    }
  }

  async function uploadResume(file: File) {
    if (!/\.pdf$/i.test(file.name)) {
      toast.error("The attachment needs to be a PDF.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/resume/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      set("resumePath", data.resumePath);
      setSaved((s) => ({ ...s, resumePath: data.resumePath }));
      router.refresh();
      toast.success("Attachment uploaded. It goes with every email from now on.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function insertToken(token: string) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? form.bodyTemplate.length;
    const end = el.selectionEnd ?? start;
    const next = form.bodyTemplate.slice(0, start) + token + form.bodyTemplate.slice(end);
    set("bodyTemplate", next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  return (
    <div>
      {/* The sender kit: a blue band, like the portfolio's, with the two things people come here to start */}
      <section className="rise relative mb-8 overflow-hidden rounded-l bg-accent-500 p-6 text-white shadow-flat md:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/F2-draft.webp" alt="" width={180} height={180} className="pointer-events-none absolute -bottom-6 right-6 hidden h-[170px] w-auto rotate-[6deg] drop-shadow-[0_18px_22px_rgba(4,12,48,.45)] md:block" />
        <div className="md:pr-[220px]">
          <div className="text-label font-extrabold uppercase tracking-[.08em] text-white/80">Settings</div>
          <h1 className="mt-2 text-h1 text-white">Your sender kit</h1>
          <p className="mt-3 max-w-[58ch] text-body-l text-white/90">The template, the file and the signature that go with every email. Keys and sending limits are further down, for later.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/people?new=1" className="btn !bg-white !text-[#1A3FA8] !shadow-[0_4px_0_rgba(4,12,48,.35)]">New campaign</a>
            <button type="button" className="btn !bg-transparent !text-white !shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.75)] hover:!bg-white/10" onClick={() => { setNewTemplate(true); document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" }); }}>
              New template
            </button>
          </div>
        </div>
      </section>

      <h2 className="mb-3 text-h3 text-ink">Every email</h2>
      <div className="mb-8 grid items-stretch gap-4 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8"><TemplateLibrary openNew={newTemplate} onOpenNew={setNewTemplate} /></div>
        <div className="min-w-0 lg:col-span-4"><SharedAttachmentCard /></div>
      </div>

      <h2 className="mb-3 text-h3 text-ink">You</h2>
      <div className="mb-8"><ProfileCard testMode={testMode} /></div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-h3 text-ink">Set up later</h2>
          <p className="mt-1 text-body-s text-muted">{testMode ? "Only your Gemini key does anything in the demo; sending is always simulated." : "Keys, Gmail and limits. Saved on this computer in data/settings.json."}</p>
        </div>
        {testMode ? null : (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={() => save()} disabled={saving || !dirty}>
              <Save size={20} strokeWidth={1.75} /> {dirty ? "Save settings" : "All saved"}
            </Button>
            <Button variant="ghost" onClick={runCheck} disabled={checking || saving}>Check setup</Button>
          </div>
        )}
      </div>
      {checking ? (
        <div className="card mb-6 rounded-m px-5 py-4">
          <Working>Calling Gemini, signing in to Gmail and reading your attachment</Working>
        </div>
      ) : null}
      {checkError ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-m bg-danger-tint px-5 py-4">
          <span className="text-body-s text-danger-text">{checkError}</span>
          <Button size="sm" variant="ghost" onClick={runCheck}>
            Try again
          </Button>
        </div>
      ) : null}
      {check ? <CheckResult result={check} /> : null}


      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <div>{testMode ? <OwnKeyCard /> : (<>
        <Card>
          <CardHeader
            title="Gemini"
            sub="Writes the two or three personal lines in each email."
          />
          <div className="flex flex-col gap-5">
            <Field
              label="API key"
              htmlFor="geminiApiKey"
              help={
                <>
                  Free from Google AI Studio.{" "}
                  <a
                    className="link inline-flex items-center gap-0.5"
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get a key <ArrowUpRight size={16} strokeWidth={1.75} />
                  </a>
                </>
              }
            >
              <Input
                id="geminiApiKey"
                type="password"
                autoComplete="off"
                value={form.geminiApiKey}
                onChange={(e) => set("geminiApiKey", e.target.value)}
                placeholder="AIza..."
              />
            </Field>
            <Field
              label="Model"
              htmlFor="geminiModel"
              help="gemini-2.5-flash is fast and has a free tier. Older 1.5 and 2.0 names switch to it automatically."
            >
              <Input
                id="geminiModel"
                value={form.geminiModel}
                onChange={(e) => set("geminiModel", e.target.value)}
              />
            </Field>
          </div>
        </Card>
      </>)}</div>
        <div><GmailConnect testMode={testMode} connectedAs={testMode ? undefined : saved.gmailEmail || undefined} /></div>
        <div>
        <Card>
          <CardHeader title="Sending" sub="Slow and steady keeps you out of spam folders." />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Seconds between emails" htmlFor="delay" help="8 or more is safe.">
              <Input
                id="delay"
                type="number"
                min={0}
                className="tabular"
                value={form.defaultDelaySeconds}
                onChange={(e) => set("defaultDelaySeconds", Number(e.target.value))}
              />
            </Field>
            <Field label="Most emails per send" htmlFor="maxPerRun" help="Gmail allows about 500 a day.">
              <Input
                id="maxPerRun"
                type="number"
                min={1}
                className="tabular"
                value={form.maxPerRun}
                onChange={(e) => set("maxPerRun", Number(e.target.value))}
              />
            </Field>
          </div>
        </Card>
      </div>
      </div>

      {testMode ? null : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Gmail" sub="Emails go out from your own account, one at a time." />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Gmail address" htmlFor="gmailEmail">
                <Input
                  id="gmailEmail"
                  type="email"
                  value={form.gmailEmail}
                  onChange={(e) => set("gmailEmail", e.target.value)}
                  placeholder="you@gmail.com"
                />
              </Field>
              <Field
                label="App password"
                htmlFor="gmailAppPassword"
                help={
                  <>
                    Not your normal password.{" "}
                    <a
                      className="link inline-flex items-center gap-0.5"
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Make one <ArrowUpRight size={16} strokeWidth={1.75} />
                    </a>
                  </>
                }
              >
                <Input
                  id="gmailAppPassword"
                  type="password"
                  autoComplete="off"
                  value={form.gmailAppPassword}
                  onChange={(e) => set("gmailAppPassword", e.target.value)}
                  placeholder="16 characters"
                />
              </Field>
              <Field label="Your name, as it shows in the inbox" htmlFor="senderName">
                <Input
                  id="senderName"
                  value={form.senderName}
                  onChange={(e) => set("senderName", e.target.value)}
                  placeholder="Your name"
                />
              </Field>
              <Field label="Reply-to (optional)" htmlFor="replyTo" help="If replies should go to another address.">
                <Input
                  id="replyTo"
                  type="email"
                  value={form.replyTo}
                  onChange={(e) => set("replyTo", e.target.value)}
                  placeholder="you@company.com"
                />
              </Field>
              <Field label="SMTP host" htmlFor="smtpHost">
                <Input id="smtpHost" value={form.smtpHost} onChange={(e) => set("smtpHost", e.target.value)} />
              </Field>
              <Field label="SMTP port" htmlFor="smtpPort" help="587 for Gmail.">
                <Input
                  id="smtpPort"
                  type="number"
                  className="tabular"
                  value={form.smtpPort}
                  onChange={(e) => set("smtpPort", Number(e.target.value))}
                />
              </Field>
            </div>
          </Card>
          <Card>
            <CardHeader title="Send yourself a test" sub="Only to the address you type." />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                aria-label="Test email address"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="another-address@example.com"
              />
              <Button onClick={sendTest} disabled={testing || !testTo.includes("@")} className="shrink-0">
                {testing ? "Sending" : "Send test email"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
          <div className="flex flex-col gap-4">
        <Card>
          <CardHeader title="Attachment (optional)" sub="A deck, one-pager or resume, attached as a PDF to every email." />
          {saved.resumePath ? (
            <div className="mb-5 flex items-center gap-3 rounded-m bg-surface px-5 py-4">
              <FileText size={20} strokeWidth={1.75} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate font-mono text-mono text-ink-2">{saved.resumePath}</span>
            </div>
          ) : null}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files?.[0];
              if (f) uploadResume(f);
            }}
            className={cn(
              "flex w-full flex-col items-center rounded-l border-[1.5px] bg-accent-50 px-6 py-8 text-center transition-transform duration-300",
              drag ? "scale-[1.01] border-solid border-accent-500" : "border-dashed border-accent-200",
            )}
          >
            {uploading ? (
              <Working>Uploading your attachment</Working>
            ) : (
              <>
                <Illustration object="paper plane" size={96} />
                <span className="mt-5 text-h3 text-ink">
                  {saved.resumePath ? "Drop a newer PDF to replace it" : "Drop a PDF here"}
                </span>
                <span className="mt-1 text-body-s text-muted">PDF only, kept inside this project folder</span>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadResume(f);
              e.target.value = "";
            }}
          />
        </Card>
      
        <Card>
          <CardHeader
            title="Your template"
            sub="Everything here is yours, word for word. Gemini only fills {{personalized_lines}}."
          />
          {placeholders.length || missingLines ? (
            <div className="mb-5 rounded-m bg-warning-tint px-5 py-4 text-body-s text-warning-text">
              {missingLines ? (
                <p>
                  The body has no {"{{personalized_lines}}"}, so the personal lines won&rsquo;t appear.
                </p>
              ) : null}
              {placeholders.length ? (
                <p>
                  Fill these before you send: {placeholders.join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-col gap-5">
            <Field label="Subject" htmlFor="subjectTemplate">
              <Input
                id="subjectTemplate"
                value={form.subjectTemplate}
                onChange={(e) => set("subjectTemplate", e.target.value)}
              />
            </Field>
            <Field label="Body" htmlFor="bodyTemplate">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-body-s text-muted">Insert:</span>
                {TOKENS.map((t) => (
                  <Chip key={t} tone="accent" className="font-mono text-mono" onClick={() => insertToken(t)}>
                    {t}
                  </Chip>
                ))}
              </div>
              <Textarea
                id="bodyTemplate"
                ref={bodyRef}
                rows={20}
                value={form.bodyTemplate}
                onChange={(e) => set("bodyTemplate", e.target.value)}
                className="text-[16px] leading-relaxed"
              />
            </Field>
            <p className="text-body-s text-muted">
              Drafts you already have keep their old text. Open one and use Rewrite or Edit to pick up
              template changes.
            </p>
          </div>
        </Card>
      </div>
        </div>
      )}
    </div>
  );
}

function CheckResult({ result }: { result: TestConfigResult }) {
  const rows = [
    { label: "Gemini", r: result.gemini },
    { label: "Gmail", r: result.smtp },
    { label: "Attachment", r: result.resume },
    { label: "Excel reader", r: result.excel },
  ];
  const bad = rows.filter((x) => !x.r.ok).length;
  return (
    <Card className="mb-6">
      <CardHeader
        title={bad ? `${bad} thing${bad === 1 ? "" : "s"} to fix` : "Everything works"}
        right={bad ? <Chip tone="warning">Check this</Chip> : <Chip tone="success">Ready to send</Chip>}
      />
      <ul className="flex flex-col gap-4">
        {rows.map(({ label, r }) => (
          <li key={label} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                r.ok ? "bg-success-tint text-success-text" : "bg-danger-tint text-danger-text",
              )}
            >
              {r.ok ? <Check size={14} strokeWidth={2.5} /> : <CircleAlert size={14} strokeWidth={2} />}
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-ink">{label}</div>
              <div className="break-words text-body-s text-muted">{r.message}</div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
