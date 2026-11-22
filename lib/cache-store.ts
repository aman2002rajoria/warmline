import { PATHS } from "./paths";
import { readJson, writeJson } from "./json-store";
import type { CacheEntry } from "@/types";

/**
 * Gemini personalization cache, keyed by lowercase email.
 * Stored as a flat object map for cheap O(1) lookups.
 */
type CacheMap = Record<string, CacheEntry>;

export function getCache(email: string): CacheEntry | null {
  const map = readJson<CacheMap>(PATHS.cache, {});
  return map[email.toLowerCase()] || null;
}

export function setCache(entry: CacheEntry): void {
  const map = readJson<CacheMap>(PATHS.cache, {});
  map[entry.email.toLowerCase()] = entry;
  writeJson(PATHS.cache, map);
}

export function clearCache(email?: string): void {
  if (!email) {
    writeJson<CacheMap>(PATHS.cache, {});
    return;
  }
  const map = readJson<CacheMap>(PATHS.cache, {});
  delete map[email.toLowerCase()];
  writeJson(PATHS.cache, map);
}
