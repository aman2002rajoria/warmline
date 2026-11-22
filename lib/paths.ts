import path from "path";
import fs from "fs";
import os from "os";

/**
 * Everything is project-relative so the project remains portable across
 * computers. `process.cwd()` is always the project root (Next.js convention).
 */
export const ROOT = process.cwd();

/**
 * Public demo (on Vercel, or WARMLINE_PUBLIC_DEMO=1): the app only ever shows test data,
 * sends nothing, and keeps its files in the temp folder, the only writable place on Vercel.
 */
export const PUBLIC_DEMO = !!process.env.VERCEL || process.env.WARMLINE_PUBLIC_DEMO === "1";
const WRITE_ROOT = PUBLIC_DEMO ? path.join(os.tmpdir(), "warmline") : ROOT;

export const PATHS = {
  root: ROOT,
  data: path.join(WRITE_ROOT, "data"),
  settings: path.join(WRITE_ROOT, "data", "settings.json"),
  generatedEmails: path.join(WRITE_ROOT, "data", "generated_emails.json"),
  sentLogs: path.join(WRITE_ROOT, "data", "sent_logs.json"),
  failedLogs: path.join(WRITE_ROOT, "data", "failed_logs.json"),
  cache: path.join(WRITE_ROOT, "data", "cache.json"),
  professorsXlsx: path.join(WRITE_ROOT, "data", "professors.xlsx"),

  uploads: path.join(WRITE_ROOT, "uploads"),
  uploadsResumes: path.join(WRITE_ROOT, "uploads", "resumes"),
  uploadsExcel: path.join(WRITE_ROOT, "uploads", "excel"),

  templates: path.join(ROOT, "templates"),
  baseEmail: path.join(ROOT, "templates", "base_email.txt"),

  logs: path.join(WRITE_ROOT, "logs"),
  logApp: path.join(WRITE_ROOT, "logs", "app.log"),
  logErrors: path.join(WRITE_ROOT, "logs", "errors.log"),
  logEmail: path.join(WRITE_ROOT, "logs", "email.log"),

  docs: path.join(ROOT, "docs"),
  scripts: path.join(ROOT, "scripts"),
  publicDir: path.join(ROOT, "public"),
};

/** Make sure every runtime directory exists. Safe to call repeatedly. */
export function ensureProjectFolders(): void {
  // In the public demo the project folder is read-only: only make the writable folders.
  const dirs = PUBLIC_DEMO ? [PATHS.data, PATHS.uploads, PATHS.uploadsResumes, PATHS.uploadsExcel, PATHS.logs] : [
    PATHS.data,
    PATHS.uploads,
    PATHS.uploadsResumes,
    PATHS.uploadsExcel,
    PATHS.templates,
    PATHS.logs,
    PATHS.docs,
    PATHS.scripts,
    PATHS.publicDir,
  ];
  for (const d of dirs) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

/** Resolve a stored project-relative path (e.g. "uploads/resumes/r.pdf") to absolute. */
export function resolveProjectPath(relativeOrAbsolute: string): string {
  if (!relativeOrAbsolute) return "";
  if (path.isAbsolute(relativeOrAbsolute)) return relativeOrAbsolute;
  return path.join(ROOT, relativeOrAbsolute);
}

/** Convert any absolute path inside the project to a project-relative one. */
export function toProjectRelative(absolute: string): string {
  const rel = path.relative(ROOT, absolute);
  return rel.split(path.sep).join("/");
}
