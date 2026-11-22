import fs from "fs";
import { getSettings } from "@/lib/settings-store";
import { resolveProjectPath } from "@/lib/paths";
import { pingGemini } from "./gemini.service";
import { verifySmtp } from "./email.service";
import { testExcelParser } from "./excel.service";
import type { TestConfigResult } from "@/types";

function testResume(): { ok: boolean; message: string } {
  const s = getSettings();
  if (!s.resumePath) {
    return { ok: false, message: "Resume path not set in Settings." };
  }
  const abs = resolveProjectPath(s.resumePath);
  if (!fs.existsSync(abs)) {
    return {
      ok: false,
      message: `Resume not found at ${s.resumePath}. Upload it in Settings → Resume.`,
    };
  }
  if (!/\.pdf$/i.test(abs)) {
    return { ok: false, message: "Resume must be a PDF (.pdf) file." };
  }
  const size = fs.statSync(abs).size;
  if (size === 0) return { ok: false, message: "Resume file is empty." };
  return {
    ok: true,
    message: `Resume found (${(size / 1024).toFixed(1)} KB) at ${s.resumePath}.`,
  };
}

export async function runFullTest(): Promise<TestConfigResult> {
  const [gemini, smtp] = await Promise.all([pingGemini(), verifySmtp()]);
  const resume = testResume();
  const excel = testExcelParser();
  return {
    gemini,
    smtp,
    resume,
    excel,
    overall: gemini.ok && smtp.ok && resume.ok && excel.ok,
  };
}
