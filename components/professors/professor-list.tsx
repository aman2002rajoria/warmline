"use client";

import { PenLine, Send, Trash2, X } from "lucide-react";
import type { ProfessorRecord } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { StatusChip } from "@/components/ui/chip";
import type { Filter, Limits } from "./professors-client";

export function ProfessorList({
  rows,
  activeId,
  onSelect,
  checked,
  setChecked,
  busy,
  toDraft,
  toSend,
  onDraft,
  onSend,
  onDelete,
  limits,
  filter,
}: {
  rows: ProfessorRecord[];
  activeId: string | null;
  onSelect: (id: string) => void;
  checked: Set<string>;
  setChecked: (s: Set<string>) => void;
  busy: boolean;
  toDraft: number;
  toSend: number;
  onDraft: () => void;
  onSend: () => void;
  onDelete: () => void;
  limits: Limits;
  filter: Filter;
}) {
  const allChecked = rows.length > 0 && rows.every((r) => checked.has(r.id));
  const someChecked = rows.some((r) => checked.has(r.id));

  function toggleAll(on: boolean) {
    const next = new Set(checked);
    rows.forEach((r) => (on ? next.add(r.id) : next.delete(r.id)));
    setChecked(next);
  }
  function toggle(id: string, on: boolean) {
    const next = new Set(checked);
    if (on) next.add(id);
    else next.delete(id);
    setChecked(next);
  }

  return (
    <section className="card rise rounded-l p-3" aria-label="Professors">
      <div className="flex min-h-[56px] items-center gap-1 px-1">
        <Checkbox
          label={allChecked ? "Unselect all shown" : "Select all shown"}
          checked={allChecked}
          indeterminate={!allChecked && someChecked}
          onChange={toggleAll}
        />
        {checked.size === 0 ? (
          <h3 className="text-h3 text-ink">
            {filter === "all" ? "Everyone" : "Shown"}{" "}
            <span className="tabular font-semibold text-muted">{rows.length}</span>
          </h3>
        ) : (
          <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
            <span className="text-label text-ink tabular">{checked.size} selected</span>
            <div className="flex items-center gap-2">
              {toDraft > 0 ? (
                <Button size="sm" variant="ghost" onClick={onDraft} disabled={busy}>
                  <PenLine size={16} strokeWidth={1.75} /> Draft {toDraft}
                </Button>
              ) : null}
              <Button size="sm" onClick={onSend} disabled={busy || toSend === 0}>
                <Send size={16} strokeWidth={1.75} /> Send {toSend}
              </Button>
              <Button size="icon" variant="ghost" onClick={onDelete} disabled={busy} aria-label="Remove selected">
                <Trash2 size={18} strokeWidth={1.75} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setChecked(new Set())}
                aria-label="Clear selection"
              >
                <X size={18} strokeWidth={1.75} />
              </Button>
            </div>
          </div>
        )}
      </div>
      {checked.size > 0 ? (
        <p className="px-4 pb-2 text-body-s text-muted">
          {toSend === 0
            ? "Only approved drafts can be sent in bulk."
            : `Up to ${limits.maxPerRun} per run, ${limits.delaySeconds}s apart.`}
        </p>
      ) : null}

      <ul className="flex max-h-none flex-col gap-1 overflow-y-auto md:max-h-[calc(100vh-300px)]">
        {rows.map((r) => {
          const active = r.id === activeId;
          return (
            <li key={r.id}>
              <div
                role="button"
                tabIndex={0}
                aria-current={active ? "true" : undefined}
                onClick={() => onSelect(r.id)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(r.id);
                  }
                }}
                className={cn(
                  "flex cursor-pointer items-start gap-1 rounded-m py-3 pl-1 pr-4 transition-colors",
                  active ? "bg-surface" : "hover:bg-surface",
                )}
              >
                <Checkbox
                  label={`Select ${r.professorName}`}
                  checked={checked.has(r.id)}
                  onChange={(on) => toggle(r.id, on)}
                />
                <div className="min-w-0 flex-1 pt-2">
                  <div className="truncate text-[17px] font-extrabold leading-tight text-ink">
                    {r.professorName}
                  </div>
                  <div className="mt-1 truncate text-body-s text-muted">
                    {[r.researchArea || r.department, r.university].filter(Boolean).join(" · ")}
                  </div>
                  <div className="mt-2">
                    <StatusChip status={r.status} />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
