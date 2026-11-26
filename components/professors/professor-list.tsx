"use client";

import { PenLine, Send, Trash2, X } from "lucide-react";
import type { ProfessorRecord } from "@/types";
import { Avatar } from "./draft-panel";
import { REPLIES } from "@/lib/demo-people";
import { Chip } from "@/components/ui/chip";
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
  filterBar,
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
  filterBar?: React.ReactNode;
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
    <section className="card rise flex flex-col rounded-l p-3 md:h-full" aria-label="People">
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

      {filterBar}
      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
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
                  "flex cursor-pointer items-center gap-2 rounded-m py-2.5 pl-1 pr-3 transition-colors",
                  active ? "bg-surface" : "hover:bg-surface",
                )}
              >
                <Checkbox
                  label={`Select ${r.professorName}`}
                  checked={checked.has(r.id)}
                  onChange={(on) => toggle(r.id, on)}
                />
                <Avatar name={r.professorName} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[16px] font-extrabold leading-tight text-ink">{r.professorName}</span>
                    <RowChip r={r} />
                  </div>
                  <div className="mt-0.5 truncate text-body-s text-muted">
                    {[r.department, r.university].filter(Boolean).join(" · ")}
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

/** The most useful thing to know about a row: replied, scheduled or a follow-up due, else its status. */
function RowChip({ r }: { r: ProfessorRecord }) {
  if (r.status === "sent" && REPLIES.some((x) => x.who === r.professorName)) return <Chip tone="success">Replied</Chip>;
  if (r.status === "approved" && r.scheduledAt) return <Chip tone="accent">Scheduled</Chip>;
  if (r.status === "sent" && r.followUpAt && !r.followUpSent) return <Chip tone="warning">Follow up</Chip>;
  return <StatusChip status={r.status} />;
}
