export type ProfessorStatus =
  | "pending"
  | "drafted"
  | "approved"
  | "sent"
  | "failed";

/**
 * One record in /data/generated_emails.json.
 * Contains BOTH the source professor info (from Excel) AND the AI-generated /
 * manually edited draft for that professor.
 */
export interface ProfessorRecord {
  id: string;
  professorName: string;
  university: string;
  email: string;
  department?: string | null;
  labWebsite?: string | null;
  researchArea?: string | null;
  notes?: string | null;

  personalizedLines?: string | null;
  finalSubject?: string | null;
  finalBody?: string | null;

  status: ProfessorStatus;
  approved?: boolean;
  /** Approved drafts can wait for a chosen time. */
  scheduledAt?: string | null;
  /** Files attached to this one email (name and size; the demo never uploads them). */
  attachments?: { name: string; size: number }[];
  /** When to nudge someone who hasn't replied, and whether the nudge went out. */
  followUpAt?: string | null;
  followUpSent?: boolean;
  sentAt?: string | null;
  errorMessage?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  geminiApiKey: string;
  geminiModel: string;

  gmailEmail: string;
  gmailAppPassword: string;
  smtpHost: string;
  smtpPort: number;

  senderName: string;
  replyTo: string;

  resumePath: string;
  defaultDelaySeconds: number;
  maxPerRun: number;

  subjectTemplate: string;
  bodyTemplate: string;
}

export interface LogEntry {
  timestamp: string;
  professorId: string;
  professorName: string;
  email: string;
  subject?: string;
  status: "sent" | "failed";
  errorMessage?: string;
}

export interface CacheEntry {
  email: string;
  lines: string;
  model: string;
  generatedAt: string;
}

export interface ExcelImportResult {
  totalRows: number;
  imported: number;
  skippedDuplicates: number;
  invalidRows: { row: number; reason: string }[];
}

export interface TestConfigResult {
  gemini: { ok: boolean; message: string };
  smtp: { ok: boolean; message: string };
  resume: { ok: boolean; message: string };
  excel: { ok: boolean; message: string };
  overall: boolean;
}
