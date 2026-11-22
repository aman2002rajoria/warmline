import fs from "fs";
import path from "path";
import { ensureProjectFolders } from "./paths";

/**
 * Tiny synchronous JSON file store. We use atomic write (tmp file + rename)
 * so a crash mid-write can never corrupt the file. Designed for a single-user
 * localhost tool with ~100–200 records — no need for anything fancier.
 */

function ensureParent(filePath: string) {
  ensureProjectFolders();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(filePath: string, data: T): void {
  ensureParent(filePath);
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}

export function appendJsonArray<T>(filePath: string, item: T): void {
  const arr = readJson<T[]>(filePath, []);
  arr.push(item);
  writeJson(filePath, arr);
}

export function updateJson<T>(filePath: string, fallback: T, fn: (data: T) => T): T {
  const current = readJson(filePath, fallback);
  const next = fn(current);
  writeJson(filePath, next);
  return next;
}
