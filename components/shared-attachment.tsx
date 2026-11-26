"use client";

import { useEffect, useState } from "react";
import { FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * One document that goes with every email (a deck, a one-pager, a resume). The demo remembers only its
 * name and size in this browser; nothing is uploaded.
 */
export type Shared = { name: string; size: number } | null;
const KEY = "warmline-shared-file";
export const DEFAULT_SHARED: Shared = { name: "Ledgerly-one-pager.pdf", size: 184_320 };

export function getShared(): Shared {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === null ? DEFAULT_SHARED : (JSON.parse(raw) as Shared);
  } catch {
    return DEFAULT_SHARED;
  }
}
function setShared(f: Shared) {
  try { localStorage.setItem(KEY, JSON.stringify(f)); window.dispatchEvent(new Event("warmline-shared")); } catch { /* not remembered */ }
}

export function SharedAttachmentCard() {
  const [file, setFile] = useState<Shared>(DEFAULT_SHARED);
  const [drag, setDrag] = useState(false);
  useEffect(() => setFile(getShared()), []);
  const take = (f?: File) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) return toast.error("Keep it under 10 MB.");
    const next = { name: f.name, size: f.size };
    setFile(next);
    setShared(next);
    toast.success(`${f.name} now goes with every email.`);
  };
  return (
    <Card className="h-full">
      <CardHeader
        title={<span className="inline-flex items-center gap-2"><Paperclip size={20} strokeWidth={1.9} className="text-accent-600" /> Shared with every email</span>}
        sub="A deck, a one-pager or a resume. You can still add files to a single email from its draft."
      />
      {file ? (
        <div className="flex items-center gap-3 rounded-m bg-surface p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-accent-500 text-white"><FileText size={20} strokeWidth={1.9} /></span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-extrabold text-ink">{file.name}</div>
            <div className="text-label text-muted">{Math.max(1, Math.round(file.size / 1024))} KB · attached to every email</div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => { setFile(null); setShared(null); toast.success("No shared attachment now."); }}>
            <Trash2 size={15} strokeWidth={1.9} /> Remove
          </Button>
        </div>
      ) : null}
      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0]); }}
        className={`mt-3 flex cursor-pointer flex-col items-center gap-1.5 rounded-m border-2 border-dashed px-4 py-6 text-center transition-colors ${drag ? "border-accent-500 bg-accent-50" : "border-line hover:border-accent-200"}`}
      >
        <Upload size={20} strokeWidth={1.9} className="text-accent-600" />
        <span className="font-semibold text-ink">{file ? "Drop a newer file to replace it" : "Drop a file here"}</span>
        <span className="text-label text-muted">or click to choose · up to 10 MB</span>
        <input type="file" className="hidden" onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
    </Card>
  );
}
