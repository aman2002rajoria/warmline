import * as XLSX from "xlsx";
import fs from "fs";
import { upsertProfessor } from "@/lib/professors-store";
import { isValidEmail } from "@/lib/utils";
import { PATHS } from "@/lib/paths";
import { logger } from "@/lib/logger";
import type { ExcelImportResult } from "@/types";

const COLUMN_ALIASES: Record<string, string[]> = {
  professorName: ["name", "full_name", "person", "contact", "professor_name", "professor", "professor name"],
  university: ["company", "organisation", "organization", "org", "university", "institution", "school", "college"],
  email: ["email", "email_id", "contact_email", "professor_email"],
  department: ["role", "title", "job_title", "department", "dept"],
  labWebsite: ["link", "website", "url", "linkedin", "lab_website", "lab_url", "lab"],
  researchArea: ["works_on", "what_they_work_on", "focus", "topic", "area", "research_area", "research", "research area"],
  notes: ["notes", "note", "remarks", "comment", "comments"],
};

function normalizeKey(k: string): string {
  return String(k).toLowerCase().trim().replace(/\s+/g, "_");
}

function pickField(row: Record<string, unknown>, field: string): string | null {
  const aliases = COLUMN_ALIASES[field] || [field];
  for (const key of Object.keys(row)) {
    const nk = normalizeKey(key);
    if (aliases.includes(nk) || aliases.includes(key.toLowerCase().trim())) {
      const v = row[key];
      if (v === undefined || v === null) return null;
      const s = String(v).trim();
      return s.length === 0 ? null : s;
    }
  }
  return null;
}

export interface ParsedProfessor {
  professorName: string;
  university: string;
  email: string;
  department: string | null;
  labWebsite: string | null;
  researchArea: string | null;
  notes: string | null;
}

export function parseExcelBuffer(buffer: Buffer): {
  rows: ParsedProfessor[];
  invalid: { row: number; reason: string }[];
  totalRows: number;
} {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { rows: [], invalid: [], totalRows: 0 };
  const sheet = workbook.Sheets[sheetName];
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
    raw: false,
  });

  const rows: ParsedProfessor[] = [];
  const invalid: { row: number; reason: string }[] = [];

  raw.forEach((r, idx) => {
    const rowNum = idx + 2; // header is row 1
    const professorName = pickField(r, "professorName");
    const university = pickField(r, "university");
    const email = pickField(r, "email");

    if (!professorName) {
      invalid.push({ row: rowNum, reason: "Missing name" });
      return;
    }
    if (!university) {
      invalid.push({ row: rowNum, reason: "Missing company" });
      return;
    }
    if (!email) {
      invalid.push({ row: rowNum, reason: "Missing email" });
      return;
    }
    if (!isValidEmail(email)) {
      invalid.push({ row: rowNum, reason: `Invalid email: ${email}` });
      return;
    }

    rows.push({
      professorName,
      university,
      email: email.toLowerCase(),
      department: pickField(r, "department"),
      labWebsite: pickField(r, "labWebsite"),
      researchArea: pickField(r, "researchArea"),
      notes: pickField(r, "notes"),
    });
  });

  return { rows, invalid, totalRows: raw.length };
}

/** Import a parsed set into data/generated_emails.json. Skips duplicates by email. */
export function importProfessors(
  parsed: ReturnType<typeof parseExcelBuffer>,
): ExcelImportResult {
  let imported = 0;
  let skipped = 0;

  for (const r of parsed.rows) {
    try {
      const { created } = upsertProfessor(r);
      if (created) imported += 1;
      else skipped += 1;
    } catch (err) {
      logger.error("Failed to import professor", {
        email: r.email,
        err: (err as Error).message,
      });
    }
  }

  return {
    totalRows: parsed.totalRows,
    imported,
    skippedDuplicates: skipped,
    invalidRows: parsed.invalid,
  };
}

/** Quick check that the bundled sample Excel still parses (Test Config feature). */
export function testExcelParser(): { ok: boolean; message: string } {
  try {
    if (!fs.existsSync(PATHS.publicDir + "/SAMPLE_EXCEL_FORMAT.xlsx")) {
      return {
        ok: false,
        message:
          "Sample Excel not found at public/SAMPLE_EXCEL_FORMAT.xlsx. Run `npm run sample:excel`.",
      };
    }
    const buf = fs.readFileSync(PATHS.publicDir + "/SAMPLE_EXCEL_FORMAT.xlsx");
    const parsed = parseExcelBuffer(buf);
    if (parsed.rows.length === 0) {
      return { ok: false, message: "Sample Excel parsed but contained 0 valid rows." };
    }
    return {
      ok: true,
      message: `Excel parser OK — sample contains ${parsed.rows.length} row(s).`,
    };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}
