import path from "path";
import fs from "fs";

/**
 * Everything is project-relative so the project remains portable across
 * computers. `process.cwd()` is always the project root (Next.js convention).
 */
export const ROOT = process.cwd();

export const PATHS = {
  root: ROOT,
  data: path.join(ROOT, "data"),
  settings: path.join(ROOT, "data", "settings.json"),
  generatedEmails: path.join(ROOT, "data", "generated_emails.json"),
  sentLogs: path.join(ROOT, "data", "sent_logs.json"),
  failedLogs: path.join(ROOT, "data", "failed_logs.json"),
  cache: path.join(ROOT, "data", "cache.json"),
  professorsXlsx: path.join(ROOT, "data", "professors.xlsx"),

  uploads: path.join(ROOT, "uploads"),
  uploadsResumes: path.join(ROOT, "uploads", "resumes"),
  uploadsExcel: path.join(ROOT, "uploads", "excel"),

  templates: path.join(ROOT, "templates"),
  baseEmail: path.join(ROOT, "templates", "base_email.txt"),

  logs: path.join(ROOT, "logs"),
  logApp: path.join(ROOT, "logs", "app.log"),
  logErrors: path.join(ROOT, "logs", "errors.log"),
  logEmail: path.join(ROOT, "logs", "email.log"),

  docs: path.join(ROOT, "docs"),
  scripts: path.join(ROOT, "scripts"),
  publicDir: path.join(ROOT, "public"),
};

/** Make sure every runtime directory exists. Safe to call repeatedly. */
export function ensureProjectFolders(): void {
  const dirs = [
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
