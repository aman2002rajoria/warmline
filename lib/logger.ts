import fs from "fs";
import { PATHS, ensureProjectFolders } from "./paths";

ensureProjectFolders();

function append(file: string, line: string) {
  try {
    fs.appendFileSync(file, line, { encoding: "utf-8" });
  } catch {
    // ignore log failures
  }
}

function safeStringify(v: unknown): string {
  if (v === undefined) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function line(level: string, message: string, meta?: unknown): string {
  const ts = new Date().toISOString();
  const m = safeStringify(meta);
  return m ? `[${ts}] [${level}] ${message} :: ${m}\n` : `[${ts}] [${level}] ${message}\n`;
}

export const logger = {
  info(msg: string, meta?: unknown) {
    const l = line("INFO", msg, meta);
    append(PATHS.logApp, l);
    if (process.env.NODE_ENV !== "production") console.log(l.trim());
  },
  warn(msg: string, meta?: unknown) {
    const l = line("WARN", msg, meta);
    append(PATHS.logApp, l);
    if (process.env.NODE_ENV !== "production") console.warn(l.trim());
  },
  error(msg: string, meta?: unknown) {
    const l = line("ERROR", msg, meta);
    append(PATHS.logErrors, l);
    append(PATHS.logApp, l);
    if (process.env.NODE_ENV !== "production") console.error(l.trim());
  },
  email(msg: string, meta?: unknown) {
    append(PATHS.logEmail, line("EMAIL", msg, meta));
  },
};

/** Return the last N lines of a log file (most recent at the bottom). */
export function tailLog(file: string, maxLines = 500): string[] {
  try {
    if (!fs.existsSync(file)) return [];
    const data = fs.readFileSync(file, "utf-8");
    const all = data.split(/\r?\n/).filter(Boolean);
    return all.slice(-maxLines);
  } catch {
    return [];
  }
}
