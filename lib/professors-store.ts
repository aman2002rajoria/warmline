import { PATHS } from "./paths";
import { readJson, writeJson } from "./json-store";
import { idFromEmail } from "./utils";
import { isTestMode, TEST_PATHS } from "./test-mode";
import type { ProfessorRecord, ProfessorStatus } from "@/types";

/**
 * Source of truth for the working professor list:
 *   data/generated_emails.json
 *
 * Records hold both source info (from Excel) and draft state (status, AI lines,
 * final subject/body). Keyed by `id` (derived from email).
 */

function readAll(): ProfessorRecord[] {
  return readJson<ProfessorRecord[]>(file(), []);
}

function writeAll(records: ProfessorRecord[]) {
  writeJson(file(), records);
}

/** Test data mode keeps its own copy (lib/test-mode.ts). */
function file() {
  return isTestMode() ? TEST_PATHS.generatedEmails : PATHS.generatedEmails;
}

export function listProfessors(): ProfessorRecord[] {
  return readAll().sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export function getProfessor(id: string): ProfessorRecord | null {
  return readAll().find((p) => p.id === id) || null;
}

export function getProfessorByEmail(email: string): ProfessorRecord | null {
  const e = email.trim().toLowerCase();
  return readAll().find((p) => p.email === e) || null;
}

export interface UpsertInput {
  professorName: string;
  university: string;
  email: string;
  department?: string | null;
  labWebsite?: string | null;
  researchArea?: string | null;
  notes?: string | null;
}

/**
 * Insert if not present (by email), update name/university/etc. otherwise.
 * Never overwrites draft fields (personalizedLines, finalSubject, finalBody).
 */
export function upsertProfessor(input: UpsertInput): {
  record: ProfessorRecord;
  created: boolean;
} {
  const all = readAll();
  const email = input.email.trim().toLowerCase();
  const id = idFromEmail(email);
  const now = new Date().toISOString();

  const idx = all.findIndex((p) => p.email === email);
  if (idx === -1) {
    const record: ProfessorRecord = {
      id,
      professorName: input.professorName,
      university: input.university,
      email,
      department: input.department ?? null,
      labWebsite: input.labWebsite ?? null,
      researchArea: input.researchArea ?? null,
      notes: input.notes ?? null,
      personalizedLines: null,
      finalSubject: null,
      finalBody: null,
      status: "pending",
      approved: false,
      sentAt: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };
    all.push(record);
    writeAll(all);
    return { record, created: true };
  }

  const existing = all[idx];
  const updated: ProfessorRecord = {
    ...existing,
    professorName: input.professorName || existing.professorName,
    university: input.university || existing.university,
    department: input.department ?? existing.department,
    labWebsite: input.labWebsite ?? existing.labWebsite,
    researchArea: input.researchArea ?? existing.researchArea,
    notes: input.notes ?? existing.notes,
    updatedAt: now,
  };
  all[idx] = updated;
  writeAll(all);
  return { record: updated, created: false };
}

export function updateProfessor(
  id: string,
  patch: Partial<ProfessorRecord>,
): ProfessorRecord | null {
  const all = readAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  all[idx] = {
    ...all[idx],
    ...patch,
    id: all[idx].id,
    updatedAt: new Date().toISOString(),
  };
  writeAll(all);
  return all[idx];
}

export function setStatus(
  id: string,
  status: ProfessorStatus,
  extra: Partial<ProfessorRecord> = {},
): ProfessorRecord | null {
  return updateProfessor(id, { status, ...extra });
}

export function deleteProfessors(ids: string[]): number {
  const set = new Set(ids);
  const all = readAll();
  const remaining = all.filter((p) => !set.has(p.id));
  const removed = all.length - remaining.length;
  writeAll(remaining);
  return removed;
}

export function countByStatus(): Record<ProfessorStatus | "total", number> {
  const all = readAll();
  const out: Record<string, number> = {
    total: all.length,
    pending: 0,
    drafted: 0,
    approved: 0,
    sent: 0,
    failed: 0,
  };
  for (const p of all) out[p.status] = (out[p.status] ?? 0) + 1;
  return out as Record<ProfessorStatus | "total", number>;
}
