"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import type { LogEntry } from "@/types";
import { fmtDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Kpi } from "@/components/ui/kpi";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/feedback";

type Tab = "sent" | "failed" | "app" | "errors";

export function LogsClient({
  sent,
  failed,
  appLog,
  errorsLog,
}: {
  sent: LogEntry[];
  failed: LogEntry[];
  appLog: string[];
  errorsLog: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<Tab>("sent");
  const total = sent.length + failed.length;
  const rate = total ? Math.round((sent.length / total) * 100) : 0;

  return (
    <>
      <PageHeader
        title="History"
        sub="Every send attempt, newest first."
        actions={
          <Button variant="ghost" onClick={() => start(() => router.refresh())} disabled={pending}>
            <RefreshCw size={20} strokeWidth={1.75} /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Kpi index={0} label="Sent" value={sent.length} accent sub="delivered to Gmail's outbox" />
        <Kpi index={1} label="Failed" value={failed.length} sub={failed.length ? "reason shown on each" : "none so far"} />
        <Kpi
          index={2}
          label="Went through"
          value={rate}
          suffix="%"
          sub={total ? `of ${total} attempts` : "no attempts yet"}
        />
      </div>

      <div className="mt-8">
        <Segmented
          label="History section"
          className="mb-4"
          value={tab}
          onChange={setTab}
          options={[
            { value: "sent", label: "Sent", count: sent.length },
            { value: "failed", label: "Failed", count: failed.length },
            { value: "app", label: "App log" },
            { value: "errors", label: "Error log" },
          ]}
        />

        <Card className="p-3 sm:p-4">
          {tab === "sent" || tab === "failed" ? (
            <LogTable rows={tab === "sent" ? sent : failed} kind={tab} />
          ) : (
            <LogLines lines={tab === "app" ? appLog : errorsLog} file={tab === "app" ? "logs/app.log" : "logs/errors.log"} />
          )}
        </Card>
      </div>
    </>
  );
}

function LogTable({ rows, kind }: { rows: LogEntry[]; kind: "sent" | "failed" }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        object={kind === "sent" ? "paper plane" : "envelope"}
        title={kind === "sent" ? "Nothing sent yet" : "No failed sends"}
        text={
          kind === "sent"
            ? "Approved emails you send from People are listed here with the time and subject."
            : "If an email can't go out, it shows up here with the reason."
        }
      />
    );
  }
  return (
    <>
      {/* Desktop table */}
      <table className="hidden w-full text-left md:table">
        <thead>
          <tr className="text-label text-muted">
            <th className="h-11 px-4 font-semibold">When</th>
            <th className="h-11 px-4 font-semibold">Person</th>
            <th className="h-11 px-4 font-semibold">{kind === "sent" ? "Subject" : "Reason"}</th>
          </tr>
        </thead>
        <tbody className="text-body-s">
          {rows.map((r, i) => (
            <tr key={`${r.timestamp}-${i}`} className="border-t border-line hover:bg-surface">
              <td className="h-12 whitespace-nowrap px-4 text-muted tabular">{fmtDateTime(r.timestamp)}</td>
              <td className="px-4 py-3">
                <div className="font-semibold text-ink">{r.professorName}</div>
                <div className="text-muted">{r.email}</div>
              </td>
              <td className={`px-4 py-3 ${kind === "failed" ? "text-danger-text" : "text-ink-2"}`}>
                {kind === "sent" ? r.subject : r.errorMessage || "Unknown error"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Mobile cards */}
      <ul className="flex flex-col gap-2 md:hidden">
        {rows.map((r, i) => (
          <li key={`${r.timestamp}-${i}`} className="rounded-m bg-surface p-4">
            <div className="font-semibold text-ink">{r.professorName}</div>
            <div className="text-body-s text-muted tabular">{fmtDateTime(r.timestamp)}</div>
            <div className={`mt-2 text-body-s ${kind === "failed" ? "text-danger-text" : "text-ink-2"}`}>
              {kind === "sent" ? r.subject : r.errorMessage || "Unknown error"}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function LogLines({ lines, file }: { lines: string[]; file: string }) {
  if (lines.length === 0) {
    return <EmptyState object="receipt" title="This log is empty" text={`Nothing written to ${file} yet.`} />;
  }
  return (
    <div>
      <p className="px-2 pb-3 pt-1 text-body-s text-muted">Last {lines.length} lines of {file}</p>
      <pre className="max-h-[60vh] overflow-auto rounded-m bg-surface p-4 font-mono text-mono text-ink-2">
        {lines.join("\n")}
      </pre>
    </div>
  );
}
