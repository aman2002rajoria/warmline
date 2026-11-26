import fs from "fs";
import { getSettings } from "./settings-store";
import { resolveProjectPath } from "./paths";
import { findPlaceholders } from "./template";
import { isTestMode } from "./test-mode";

export interface SetupItem {
  key: "gemini" | "gmail" | "resume" | "template";
  label: string;
  ok: boolean;
  detail: string;
}


/** Cheap, offline check of what's configured. "Check setup" in Settings does the live test. */
export function getSetupStatus(): { items: SetupItem[]; ready: boolean; toFix: number } {
  if (isTestMode()) {
    const items: SetupItem[] = [
      { key: "gemini", label: "Gemini key", ok: true, detail: "Test lines, or add your own key in Settings" },
      { key: "gmail", label: "Gmail", ok: true, detail: "Simulated, nothing is emailed" },
      { key: "resume", label: "Attachment", ok: true, detail: "Optional" },
      { key: "template", label: "Template", ok: true, detail: "A sample template" },
    ];
    return { items, ready: true, toFix: 0 };
  }
  const s = getSettings();

  let resumeOk = false;
  if (s.resumePath) {
    try {
      resumeOk = fs.statSync(resolveProjectPath(s.resumePath)).size > 0;
    } catch {
      resumeOk = false;
    }
  }
  const placeholders = findPlaceholders(`${s.subjectTemplate}\n${s.bodyTemplate}`);

  const items: SetupItem[] = [
    {
      key: "gemini",
      label: "Gemini key",
      ok: Boolean(s.geminiApiKey),
      detail: s.geminiApiKey ? s.geminiModel : "Needed to write the personal lines",
    },
    {
      key: "gmail",
      label: "Gmail",
      ok: Boolean(s.gmailEmail && s.gmailAppPassword),
      detail:
        s.gmailEmail && s.gmailAppPassword
          ? s.gmailEmail
          : "Add your address and an app password",
    },
    {
      key: "resume",
      label: "Attachment",
      ok: resumeOk,
      detail: resumeOk ? "Attached to every email" : "Optional PDF",
    },
    {
      key: "template",
      label: "Template",
      ok: placeholders.length === 0,
      detail:
        placeholders.length === 0
          ? "No placeholders left"
          : `${placeholders.length} placeholder${placeholders.length === 1 ? "" : "s"} to fill, like ${placeholders[0]}`,
    },
  ];
  const toFix = items.filter((i) => !i.ok).length;
  return { items, ready: toFix === 0, toFix };
}
