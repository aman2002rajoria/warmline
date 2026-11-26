"use client";

import { useRef, useState } from "react";
import type { ExcelImportResult } from "@/types";
import { cn } from "@/lib/utils";
import { plural } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Illustration, Working } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";
import { api } from "./api";

const REQUIRED = ["name", "company", "email"];
const OPTIONAL = ["role", "works_on", "link", "notes"];

export function ImportModal({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onImported: () => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExcelImportResult | null>(null);

  function close(o: boolean) {
    onOpenChange(o);
    if (!o) {
      setResult(null);
      setError(null);
    }
  }

  async function upload(file: File) {
    if (!/\.xlsx?$/i.test(file.name)) {
      setError("That isn't an Excel file. Choose a .xlsx or .xls sheet.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.importSheet(file);
      setResult(res);
      await onImported();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={close}
      wide
      title={result ? "Sheet imported" : "Import people"}
      description={
        result
          ? undefined
          : "One row per person. Your list keeps existing drafts; a row with an email you already have updates that person's details."
      }
      footer={
        result ? (
          <Button variant="primary" onClick={() => close(false)}>
            Done
          </Button>
        ) : null
      }
    >
      {result ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Added" value={result.imported} accent />
            <Stat label="Already in list" value={result.skippedDuplicates} />
            <Stat label="Skipped rows" value={result.invalidRows.length} />
          </div>
          {result.invalidRows.length ? (
            <div className="rounded-m bg-warning-tint p-5">
              <div className="font-extrabold text-warning-text">
                {plural(result.invalidRows.length, "row")} couldn&rsquo;t be read
              </div>
              <ul className="mt-2 flex flex-col gap-1 text-body-s text-warning-text">
                {result.invalidRows.slice(0, 8).map((r) => (
                  <li key={r.row}>
                    Row {r.row}: {r.reason}
                  </li>
                ))}
                {result.invalidRows.length > 8 ? (
                  <li>and {result.invalidRows.length - 8} more</li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <button
            type="button"
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
              if (f) upload(f);
            }}
            disabled={busy}
            className={cn(
              "flex flex-col items-center rounded-l border-[1.5px] bg-accent-50 px-6 py-8 text-center transition-transform duration-300",
              drag ? "scale-[1.01] border-solid border-accent-500" : "border-dashed border-accent-200",
            )}
          >
            {busy ? (
              <Working>Reading your sheet</Working>
            ) : (
              <>
                <Illustration object="envelope stack" size={96} />
                <span className="mt-5 text-h3 text-ink">Drop your sheet here, or click to choose</span>
                <span className="mt-1 text-body-s text-muted">.xlsx or .xls, first sheet only</span>
              </>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />

          {error ? (
            <div className="rounded-m bg-danger-tint px-5 py-4 text-body-s text-danger-text">{error}</div>
          ) : null}

          <div className="flex flex-col gap-3">
            <div className="text-label text-ink-2">Columns</div>
            <div className="flex flex-wrap gap-2">
              {REQUIRED.map((c) => (
                <Chip key={c} tone="accent" className="font-mono text-mono">
                  {c}
                </Chip>
              ))}
              {OPTIONAL.map((c) => (
                <Chip key={c} className="font-mono text-mono">
                  {c}
                </Chip>
              ))}
            </div>
            <p className="text-body-s text-muted">
              Blue ones are required. What they work on and your notes give Gemini something real to mention.{" "}
              <a href="/SAMPLE_EXCEL_FORMAT.xlsx" download className="link">
                Download sample sheet ↓
              </a>
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-m bg-surface p-4">
      <div className="text-body-s font-semibold text-muted">{label}</div>
      <div className={cn("mt-2 text-number tabular", accent ? "text-accent-500" : "text-ink")}>
        {value}
      </div>
    </div>
  );
}
