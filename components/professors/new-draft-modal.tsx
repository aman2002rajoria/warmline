"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
import type { ProfessorRecord } from "@/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/field";
import { api } from "./api";

/** Start a draft for one person by hand: add them, then Gemini writes their lines. */
export function NewDraftModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (p: ProfessorRecord) => void;
}) {
  const empty = { professorName: "", email: "", university: "", department: "", researchArea: "", labWebsite: "", notes: "" };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const ready = f.professorName.trim() && f.university.trim() && /\S+@\S+\.\S+/.test(f.email);

  async function create() {
    setBusy(true);
    try {
      const p = await api.create({
        professorName: f.professorName.trim(),
        email: f.email.trim(),
        university: f.university.trim(),
        department: f.department.trim() || null,
        researchArea: f.researchArea.trim() || null,
        labWebsite: f.labWebsite.trim() || null,
        notes: f.notes.trim() || null,
      });
      const drafted = await api.writeDraft(p.id).catch((e) => {
        toast.error((e as Error).message);
        return p;
      });
      onCreated(drafted);
      setF(empty);
      onOpenChange(false);
      toast.success(`Draft ready for ${p.professorName.split(" ")[0]}.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New draft"
      description="Who are you writing to? What they work on, or a note, gives Gemini something real to mention."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={create} disabled={!ready || busy}>
            <PenLine size={18} strokeWidth={1.9} /> {busy ? "Writing…" : "Add & write draft"}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Name *" aria-label="Name" value={f.professorName} onChange={set("professorName")} autoFocus />
        <Input placeholder="Email *" aria-label="Email" type="email" value={f.email} onChange={set("email")} />
        <Input placeholder="Company *" aria-label="Company" value={f.university} onChange={set("university")} />
        <Input placeholder="Role" aria-label="Role" value={f.department} onChange={set("department")} />
        <Input className="sm:col-span-2" placeholder="What they work on (a talk, a post, a project)" aria-label="What they work on" value={f.researchArea} onChange={set("researchArea")} />
        <Input className="sm:col-span-2" placeholder="A link (LinkedIn, a post, their site)" aria-label="Link" value={f.labWebsite} onChange={set("labWebsite")} />
        <Textarea className="sm:col-span-2" rows={3} placeholder="Your notes about them" aria-label="Notes" value={f.notes} onChange={set("notes")} />
      </div>
    </Modal>
  );
}
