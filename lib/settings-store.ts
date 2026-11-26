import { PATHS } from "./paths";
import { readJson, writeJson } from "./json-store";
import type { AppSettings } from "@/types";
import { DEFAULT_GEMINI_MODEL, normalizeGeminiModelId } from "./gemini-config";

export const DEFAULT_SUBJECT_TEMPLATE = "A quick question for you, {{first_name}}";

export const DEFAULT_BODY_TEMPLATE = `Hi {{first_name}},

{{personalized_lines}}

I'm [YOUR NAME], [ONE LINE ON WHO YOU ARE AND WHAT YOU'RE WORKING ON].

[YOUR ASK, IN ONE OR TWO SENTENCES: A 20-MINUTE CALL, FEEDBACK, AN INTRO, A ROLE...]

Thanks for reading,
[YOUR NAME]
[YOUR LINK]`;

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: "",
  geminiModel: DEFAULT_GEMINI_MODEL,

  gmailEmail: "",
  gmailAppPassword: "",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,

  senderName: "",
  replyTo: "",

  resumePath: "uploads/resumes/resume.pdf",
  defaultDelaySeconds: 8,
  maxPerRun: 40,

  subjectTemplate: DEFAULT_SUBJECT_TEMPLATE,
  bodyTemplate: DEFAULT_BODY_TEMPLATE,
};

/** Read settings (returns defaults merged with any saved values). */
export function getSettings(): AppSettings {
  const saved = readJson<Partial<AppSettings>>(PATHS.settings, {});
  const merged = { ...DEFAULT_SETTINGS, ...saved } as AppSettings;
  merged.geminiModel = normalizeGeminiModelId(merged.geminiModel);
  return merged;
}

/** Persist a partial update to data/settings.json. */
export function saveSettings(patch: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const next: AppSettings = { ...current, ...patch };
  next.geminiModel = normalizeGeminiModelId(next.geminiModel);
  writeJson(PATHS.settings, next);
  return next;
}

/** Reset settings to defaults (kept for completeness, not used in UI). */
export function resetSettings(): AppSettings {
  writeJson(PATHS.settings, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}
