import { PATHS } from "./paths";
import { readJson, writeJson } from "./json-store";
import type { AppSettings } from "@/types";
import { DEFAULT_GEMINI_MODEL, normalizeGeminiModelId } from "./gemini-config";

export const DEFAULT_SUBJECT_TEMPLATE =
  "Research Internship Inquiry — {{professor_name}}, {{university}}";

export const DEFAULT_BODY_TEMPLATE = `Dear Professor {{professor_name}},

I hope this email finds you well. My name is [YOUR NAME] and I am a [YOUR YEAR] undergraduate student at [YOUR UNIVERSITY], majoring in [YOUR MAJOR].

{{personalized_lines}}

I would be grateful for the opportunity to contribute to your group as a research intern during [TARGET TERM]. I am comfortable with [KEY SKILLS / TOOLS], and I am eager to develop deeper expertise under your mentorship. I have attached my resume for your reference.

Thank you for taking the time to read this email. I would be glad to discuss how I could be useful to your ongoing work at a time convenient for you.

Best regards,
[YOUR NAME]
[YOUR PHONE]
[YOUR PORTFOLIO / LINKEDIN]`;

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
