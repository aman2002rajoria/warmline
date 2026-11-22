"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Upload } from "lucide-react";
import { toast } from "sonner";
import type { ProfessorRecord, ProfessorStatus } from "@/types";
import { plural } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState, Working } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { api } from "./api";
import { ProfessorList } from "./professor-list";
import { DraftPanel } from "./draft-panel";
import { ImportModal } from "./import-modal";
import { TryTestData } from "@/components/test-mode";

export type Filter = "all" | ProfessorStatus;

export interface Limits {
  maxPerRun: number;
  delaySeconds: number;
}

type Job =
  | { kind: "drafting"; done: number; total: number; name: string }
  | { kind: "sending"; total: number };

/** Ready to go out in a bulk send: has a draft, was approved (or failed before). */
export function canBulkSend(p: ProfessorRecord) {
  return Boolean(p.finalSubject && p.finalBody) && (p.status === "approved" || p.status === "failed");
}

export function ProfessorsClient({
  initial,
  initialFilter,
  openImport,
  limits,
  sender,
  testMode,
}: {
  initial: ProfessorRecord[];
  initialFilter: Filter;
  openImport: boolean;
  limits: Limits;
  sender: string;
  testMode: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [job, setJob] = useState<Job | null>(null);
  const [confirm, setConfirm] = useState<null | "send" | "delete">(null);
  const [importOpen, setImportOpen] = useState(openImport);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: rows.length, pending: 0, drafted: 0, approved: 0, sent: 0, failed: 0 };
    rows.forEach((r) => (c[r.status] += 1));
    return c;
  }, [rows]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (filter === "all" || r.status === filter) &&
        (!q ||
          [r.professorName, r.email, r.university, r.researchArea, r.department]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(q))),
    );
  }, [rows, filter, query]);

  const active =
    shown.find((r) => r.id === activeId) ?? (activeId ? rows.find((r) => r.id === activeId) : null) ?? shown[0] ?? null;

  const checkedRows = rows.filter((r) => checked.has(r.id));
  const toDraft = checkedRows.filter((r) => r.status === "pending");
  const toSend = checkedRows.filter(canBulkSend);

  // Drop the ?filter= / ?import= from the URL once read, so refreshes start clean.
  useEffect(() => {
    if (window.location.search) router.replace("/professors", { scroll: false });
  }, [router]);

  async function refresh() {
    try {
      setRows(await api.list());
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function replace(p: ProfessorRecord) {
    setRows((prev) => prev.map((r) => (r.id === p.id ? p : r)));
  }

  function select(id: string) {
    setActiveId(id);
    if (window.innerWidth < 900) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  }

  async function draftChecked() {
    const list = toDraft;
    let failed = 0;
    let firstError = "";
    for (let i = 0; i < list.length; i += 1) {
      setJob({ kind: "drafting", done: i, total: list.length, name: list[i].professorName });
      try {
        replace(await api.writeDraft(list[i].id));
      } catch (err) {
        failed += 1;
        firstError ||= (err as Error).message;
      }
    }
    setJob(null);
    setChecked(new Set());
    if (failed) toast.error(`${list.length - failed} drafted, ${failed} failed. ${firstError}`);
    else toast.success(`${plural(list.length, "draft")} written. Read them before you send.`);
    await refresh();
  }

  async function sendChecked() {
    setConfirm(null);
    const ids = toSend.map((r) => r.id);
    setJob({ kind: "sending", total: Math.min(ids.length, limits.maxPerRun || ids.length) });
    try {
      const res = await api.send(ids);
      if (res.failed) toast.error(`${res.sent} sent, ${res.failed} failed. See the reason on each one.`);
      else
        toast.success(
          testMode
            ? `${plural(res.sent, "email")} sent in test mode. Nothing left your computer.`
            : `${plural(res.sent, "email")} sent from your Gmail.`,
        );
      setChecked(new Set());
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setJob(null);
      await refresh();
    }
  }

  async function deleteChecked() {
    setConfirm(null);
    try {
      const { deleted } = await api.remove([...checked]);
      toast.success(`${plural(deleted, "professor")} removed.`);
      setChecked(new Set());
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const summary = rows.length
    ? [
        plural(rows.length, "professor"),
        counts.drafted ? `${counts.drafted} to review` : null,
        counts.sent ? `${counts.sent} sent` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Import a sheet of professors to get started.";

  const skipped = checkedRows.length - toSend.length;
  const overLimit = limits.maxPerRun > 0 && toSend.length > limits.maxPerRun;

  return (
    <>
      <PageHeader
        title="Professors"
        sub={summary}
        actions={
          rows.length && !testMode ? (
            <Button variant="ghost" onClick={() => setImportOpen(true)}>
              <Upload size={20} strokeWidth={1.75} /> Import sheet
            </Button>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <Card index={0}>
          <EmptyState
            object="mailbox"
            title="Add the professors you want to write to"
            text="Import an Excel sheet with name, university and email. A research area or a note for each one gives Gemini something real to mention."
          >
            <Button variant="primary" onClick={() => setImportOpen(true)}>
              <Upload size={20} strokeWidth={1.75} /> Import a sheet
            </Button>
            {testMode ? null : <TryTestData />}
          </EmptyState>
          <p className="pb-4 text-center text-body-s text-muted">
            Not sure of the format?{" "}
            <a href="/SAMPLE_EXCEL_FORMAT.xlsx" download className="link">
              Download sample sheet ↓
            </a>
          </p>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Segmented
              label="Filter by status"
              value={filter}
              onChange={(f) => {
                setFilter(f);
                setActiveId(null);
              }}
              options={[
                { value: "all", label: "All", count: counts.all },
                { value: "pending", label: "No draft", count: counts.pending },
                { value: "drafted", label: "To review", count: counts.drafted },
                { value: "approved", label: "Approved", count: counts.approved },
                { value: "sent", label: "Sent", count: counts.sent },
                { value: "failed", label: "Failed", count: counts.failed },
              ]}
            />
            <div className="relative w-full sm:w-72">
              <Search
                size={16}
                strokeWidth={1.75}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
              />
              <input
                className="input pl-10"
                placeholder="Search name, university, area"
                aria-label="Search professors"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          {job ? (
            <div className="card mb-4 rounded-m px-5 py-4">
              {job.kind === "drafting" ? (
                <Working>
                  Writing draft {job.done + 1} of {job.total}: reading {job.name}&rsquo;s research
                  area and notes
                </Working>
              ) : (
                <Working>
                  Sending {plural(job.total, "email")} from your Gmail, {limits.delaySeconds}s apart.
                  Keep this tab open.
                </Working>
              )}
            </div>
          ) : null}

          <div className="grid items-start gap-4 md:grid-cols-12">
            <div className="min-w-0 md:col-span-5 lg:col-span-4">
              <ProfessorList
                rows={shown}
                activeId={active?.id ?? null}
                onSelect={select}
                checked={checked}
                setChecked={setChecked}
                busy={Boolean(job)}
                toDraft={toDraft.length}
                toSend={toSend.length}
                onDraft={draftChecked}
                onSend={() => setConfirm("send")}
                onDelete={() => setConfirm("delete")}
                limits={limits}
                filter={filter}
              />
            </div>
            <div ref={detailRef} className="min-w-0 scroll-mt-24 md:col-span-7 lg:col-span-8">
              {active ? (
                <DraftPanel
                  key={`${active.id}-${active.updatedAt}`}
                  p={active}
                  testMode={testMode}
                  sender={sender}
                  disabled={Boolean(job)}
                  onUpdated={replace}
                  onRefresh={refresh}
                />
              ) : (
                <Card>
                  <EmptyState
                    object="envelope"
                    title="Nobody matches"
                    text="Try another status or clear the search."
                  >
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setFilter("all");
                        setQuery("");
                      }}
                    >
                      Show everyone
                    </Button>
                  </EmptyState>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={refresh}
      />

      <Modal
        open={confirm === "send"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Send ${plural(toSend.length, "email")}?`}
        description={
          <>
            They go out one at a time from {sender || "your Gmail"}, {limits.delaySeconds} seconds
            apart, with your resume attached.
          </>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={sendChecked}>
              Send {plural(Math.min(toSend.length, limits.maxPerRun || toSend.length), "email")}
            </Button>
          </>
        }
      >
        {skipped > 0 || overLimit ? (
        <ul className="flex flex-col gap-2 text-body-s text-ink-2">
          {skipped > 0 ? (
            <li className="rounded-s bg-warning-tint px-4 py-3 text-warning-text">
              {plural(skipped, "selected professor")} {skipped === 1 ? "isn't" : "aren't"} approved
              yet and will be skipped.
            </li>
          ) : null}
          {overLimit ? (
            <li className="rounded-s bg-warning-tint px-4 py-3 text-warning-text">
              Only the first {limits.maxPerRun} go out this run, your limit in Settings.
            </li>
          ) : null}
        </ul>
        ) : null}
      </Modal>

      <Modal
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Remove ${plural(checked.size, "professor")}?`}
        description="Their drafts are deleted too. Emails already sent stay in History."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={deleteChecked}>
              Remove {plural(checked.size, "professor")}
            </Button>
          </>
        }
      />
    </>
  );
}
