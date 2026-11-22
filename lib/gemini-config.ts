/**
 * Gemini model IDs for the Google AI (Generative Language) API.
 * Legacy 1.5 ids often return 404 on newer keys — map them to current models.
 *
 * @see https://ai.google.dev/gemini-api/docs/models/gemini
 */

/** Default for new installs and when the field is empty. */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Map deprecated / removed / unwanted model names to the Flash model we use.
 * `gemini-2.0-flash` is remapped because many free-tier keys have **zero**
 * quota on 2.0 while 2.5 still works — avoids accidental 2.0 calls from old
 * settings or docs.
 */
const LEGACY_GEMINI_MODEL_MAP: Record<string, string> = {
  "gemini-2.0-flash": "gemini-2.5-flash",
  "gemini-2.0-flash-001": "gemini-2.5-flash",
  "gemini-2.0-flash-lite": "gemini-2.5-flash",
  "gemini-2.0-flash-lite-preview": "gemini-2.5-flash",
  "gemini-1.5-flash": "gemini-2.5-flash",
  "gemini-1.5-flash-001": "gemini-2.5-flash",
  "gemini-1.5-flash-002": "gemini-2.5-flash",
  "gemini-1.5-flash-8b": "gemini-2.5-flash",
  "gemini-1.5-flash-latest": "gemini-2.5-flash",
  "gemini-1.5-pro": "gemini-2.5-flash",
  "gemini-1.5-pro-001": "gemini-2.5-flash",
  "gemini-1.5-pro-002": "gemini-2.5-flash",
  "gemini-1.5-pro-latest": "gemini-2.5-flash",
  "gemini-pro": "gemini-2.5-flash",
};

/**
 * Returns a model id accepted by `generateContent` today.
 * Strips optional `models/` prefix from copy-paste mistakes.
 */
export function normalizeGeminiModelId(raw: string | undefined | null): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return DEFAULT_GEMINI_MODEL;
  const bare = trimmed.replace(/^models\//, "");
  return LEGACY_GEMINI_MODEL_MAP[bare] ?? bare;
}
