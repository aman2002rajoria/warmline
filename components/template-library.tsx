"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { getActiveId, getCustom, saveCustom, setActiveId, STARTERS, type Template } from "@/lib/templates";

const TOKENS = ["{{first_name}}", "{{name}}", "{{company}}", "{{personalized_lines}}"];

/** Pick the template new drafts use, preview it, or write your own. */
export function TemplateLibrary({ openNew, onOpenNew }: { openNew: boolean; onOpenNew: (o: boolean) => void }) {
  const [custom, setCustom] = useState<Template[]>([]);
  const [active, setActive] = useState(STARTERS[0].id);
  const [view, setView] = useState(STARTERS[0].id);
  useEffect(() => {
    const read = () => { setCustom(getCustom()); const a = getActiveId(); setActive(a); setView(a); };
    read();
    window.addEventListener("warmline-templates", read);
    return () => window.removeEventListener("warmline-templates", read);
  }, []);
  const all = [...STARTERS, ...custom];
  const shown = all.find((t) => t.id === view) ?? all[0];

  return (
    <div id="templates" className="h-full scroll-mt-24"><Card className="h-full">
      <CardHeader
        title={<span className="inline-flex items-center gap-2"><FileText size={20} strokeWidth={1.9} className="text-accent-600" /> Templates</span>}
        sub="New drafts use the one marked in use. The AI only writes the personal lines and the subject."
        right={<Button size="sm" variant="ghost" onClick={() => onOpenNew(true)}><Plus size={16} strokeWidth={1.9} /> New template</Button>}
      />
      <div className="grid gap-4 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <ul className="flex flex-col gap-1">
          {all.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => setView(t.id)} aria-current={view === t.id ? "true" : undefined}
                className={`flex w-full items-start gap-2 rounded-m px-3 py-2.5 text-left transition-colors ${view === t.id ? "bg-surface" : "hover:bg-surface"}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${t.id === active ? "bg-accent-500" : "bg-surface-2"}`} />
                <span className="min-w-0">
                  <span className="block truncate font-extrabold text-ink">{t.name}</span>
                  <span className="block truncate text-label text-muted">{t.id === active ? "In use" : t.use}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="min-w-0 rounded-m bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="min-w-0">
              <div className="text-label text-muted">Subject</div>
              <div className="truncate font-semibold text-ink">{shown.subject}</div>
            </div>
            <div className="flex items-center gap-2">
              {shown.custom ? (
                <Button size="sm" variant="ghost" onClick={() => { const next = custom.filter((c) => c.id !== shown.id); saveCustom(next); if (active === shown.id) setActiveId(STARTERS[0].id); toast.success("Template removed."); }}>
                  <Trash2 size={15} strokeWidth={1.9} /> Remove
                </Button>
              ) : null}
              <Button size="sm" variant="primary" disabled={shown.id === active} onClick={() => { setActiveId(shown.id); toast.success(`New drafts now use "${shown.name}".`); }}>
                <Check size={15} strokeWidth={1.9} /> {shown.id === active ? "In use" : "Use this"}
              </Button>
            </div>
          </div>
          <pre className="mt-3 max-h-[260px] overflow-y-auto whitespace-pre-wrap font-sans text-body-s leading-relaxed text-ink-2">
            {shown.body.split(/(\{\{\w+\}\})/).map((part, i) =>
              /^\{\{\w+\}\}$/.test(part) ? <mark key={i} className="rounded-[6px] bg-accent-100 px-1 text-accent-700">{part}</mark> : <span key={i}>{part}</span>,
            )}
          </pre>
        </div>
      </div>
      <NewTemplate open={openNew} onOpenChange={onOpenNew} onSave={(t) => { saveCustom([...custom, t]); setActiveId(t.id); setView(t.id); }} />
    </Card></div>
  );
}

function NewTemplate({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; onSave: (t: Template) => void }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("A quick question for you, {{first_name}}");
  const [body, setBody] = useState("Hi {{first_name}},\n\n{{personalized_lines}}\n\n");
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const ok = name.trim() && body.includes("{{personalized_lines}}");
  const insert = (tok: string) => {
    const el = ref.current;
    if (!el) return setBody((b) => b + tok);
    const s = el.selectionStart, e = el.selectionEnd;
    setBody((b) => b.slice(0, s) + tok + b.slice(e));
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = s + tok.length; });
  };
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="New template"
      description="Write it once. The AI fills {{personalized_lines}} for each person, and writes a subject that points at their hook."
      footer={<>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button variant="primary" disabled={!ok} onClick={() => { onSave({ id: `custom-${Date.now()}`, name: name.trim(), use: "Your template", subject, body, custom: true }); onOpenChange(false); setName(""); toast.success("Template saved and in use."); }}>
          <Check size={18} strokeWidth={1.9} /> Save template
        </Button>
      </>}>
      <div className="flex flex-col gap-3">
        <Input placeholder="Name, e.g. Partnership ask" aria-label="Template name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Input placeholder="Subject (the fallback when the AI has nothing specific)" aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {TOKENS.map((t) => (
            <button key={t} type="button" onClick={() => insert(t)} className="rounded-full bg-accent-50 px-2.5 py-1 font-mono text-[12px] text-accent-700 hover:bg-accent-100">{t}</button>
          ))}
        </div>
        <Textarea ref={ref} rows={10} aria-label="Template body" value={body} onChange={(e) => setBody(e.target.value)} className="text-[15px] leading-relaxed" />
        {!body.includes("{{personalized_lines}}") ? <p className="text-label text-warning-text">Keep {"{{personalized_lines}}"} somewhere: that&rsquo;s where the personal lines go.</p> : null}
      </div>
    </Modal>
  );
}
