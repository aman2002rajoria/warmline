import { PATHS } from "./paths";
import { readJson, appendJsonArray } from "./json-store";
import type { LogEntry } from "@/types";
import { isTestMode, TEST_PATHS } from "./test-mode";

const sentFile = () => (isTestMode() ? TEST_PATHS.sentLogs : PATHS.sentLogs);
const failedFile = () => (isTestMode() ? TEST_PATHS.failedLogs : PATHS.failedLogs);

const MAX_LOG_ENTRIES = 2000;

export function recordSent(entry: Omit<LogEntry, "status">) {
  appendJsonArray<LogEntry>(sentFile(), { ...entry, status: "sent" });
  truncate(sentFile());
}

export function recordFailed(entry: Omit<LogEntry, "status">) {
  appendJsonArray<LogEntry>(failedFile(), { ...entry, status: "failed" });
  truncate(failedFile());
}

export function readSent(): LogEntry[] {
  return readJson<LogEntry[]>(sentFile(), []);
}

export function readFailed(): LogEntry[] {
  return readJson<LogEntry[]>(failedFile(), []);
}

function truncate(file: string) {
  const data = readJson<LogEntry[]>(file, []);
  if (data.length > MAX_LOG_ENTRIES) {
    const trimmed = data.slice(-MAX_LOG_ENTRIES);
    const fs = require("fs");
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(trimmed, null, 2), "utf-8");
    fs.renameSync(tmp, file);
  }
}

/** Combined view, sorted newest-first. */
export function readAllLogs(): LogEntry[] {
  return [...readSent(), ...readFailed()].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  );
}
