import fs from "fs";
import path from "path";
import nodemailer, { Transporter } from "nodemailer";
import { getSettings } from "@/lib/settings-store";
import { resolveProjectPath } from "@/lib/paths";
import { renderTemplate, sleep } from "@/lib/utils";
import {
  getProfessor,
  setStatus,
  updateProfessor,
} from "@/lib/professors-store";
import { recordSent, recordFailed } from "@/lib/logs-store";
import { logger } from "@/lib/logger";
import { isTestMode, TEST_SUBJECT, TEST_TEMPLATE } from "@/lib/test-mode";

export interface BuildEmailInput {
  professorName: string;
  university: string;
  personalizedLines: string;
}

export function buildEmail(input: BuildEmailInput) {
  const s = getSettings();
  const vars = {
    professor_name: input.professorName,
    university: input.university,
    personalized_lines: input.personalizedLines,
  };
  const test = isTestMode();
  return {
    subject: renderTemplate(test ? TEST_SUBJECT : s.subjectTemplate, vars),
    body: renderTemplate(test ? TEST_TEMPLATE : s.bodyTemplate, vars),
  };
}

let cachedTransport: { key: string; transport: Transporter } | null = null;

function getTransport(): Transporter {
  const s = getSettings();
  if (!s.gmailEmail || !s.gmailAppPassword) {
    throw new Error(
      "Gmail credentials are not configured. Add email + App Password in Settings.",
    );
  }
  const key = `${s.smtpHost}|${s.smtpPort}|${s.gmailEmail}`;
  if (cachedTransport && cachedTransport.key === key) return cachedTransport.transport;
  const transport = nodemailer.createTransport({
    host: s.smtpHost,
    port: s.smtpPort,
    secure: s.smtpPort === 465,
    auth: { user: s.gmailEmail, pass: s.gmailAppPassword },
  });
  cachedTransport = { key, transport };
  return transport;
}

/** Reset cached transport (call after settings update). */
export function resetTransport() {
  cachedTransport = null;
}

export async function verifySmtp(): Promise<{ ok: boolean; message: string }> {
  try {
    const t = getTransport();
    await t.verify();
    return { ok: true, message: "Gmail SMTP connection verified." };
  } catch (err) {
    return { ok: false, message: (err as Error).message };
  }
}

export interface SendEmailParams {
  toEmail: string;
  subject: string;
  body: string;
  attachmentAbsPath?: string | null;
}

export async function sendOneEmail(params: SendEmailParams) {
  if (isTestMode()) {
    // Simulated: nothing leaves this computer.
    await sleep(400);
    if (!/@[^@]+\.[^@]+$/.test(params.toEmail)) {
      throw new Error("No recipients defined: the address has no domain ending.");
    }
    return;
  }
  const s = getSettings();
  const transport = getTransport();

  const attachments: { filename: string; path: string }[] = [];
  if (params.attachmentAbsPath) {
    const abs = resolveProjectPath(params.attachmentAbsPath);
    if (fs.existsSync(abs)) {
      attachments.push({ filename: path.basename(abs), path: abs });
    } else {
      logger.warn("Resume not found at configured path", { abs });
    }
  }

  const from = s.senderName
    ? `"${s.senderName}" <${s.gmailEmail}>`
    : s.gmailEmail;

  return transport.sendMail({
    from,
    to: params.toEmail,
    replyTo: s.replyTo || undefined,
    subject: params.subject,
    text: params.body,
    attachments,
  });
}

export interface BulkSendResult {
  attempted: number;
  sent: number;
  failed: number;
  details: {
    professorId: string;
    email: string;
    status: "sent" | "failed";
    error?: string;
  }[];
}

/**
 * Send selected professors' approved drafts now, with delay between each.
 * No future-scheduling (kept simple per spec).
 */
export async function bulkSend(professorIds: string[]): Promise<BulkSendResult> {
  const s = getSettings();
  const delayMs = isTestMode() ? 600 : Math.max(0, (s.defaultDelaySeconds || 0) * 1000);

  const result: BulkSendResult = {
    attempted: 0,
    sent: 0,
    failed: 0,
    details: [],
  };

  const targets = professorIds
    .slice(0, s.maxPerRun || professorIds.length)
    .map((id) => getProfessor(id))
    .filter((p): p is NonNullable<ReturnType<typeof getProfessor>> => !!p);

  for (let i = 0; i < targets.length; i += 1) {
    const p = targets[i];
    result.attempted += 1;

    if (!p.finalSubject || !p.finalBody) {
      const msg = "Email not drafted yet (missing subject/body).";
      setStatus(p.id, "failed", { errorMessage: msg });
      recordFailed({
        timestamp: new Date().toISOString(),
        professorId: p.id,
        professorName: p.professorName,
        email: p.email,
        errorMessage: msg,
      });
      result.failed += 1;
      result.details.push({
        professorId: p.id,
        email: p.email,
        status: "failed",
        error: msg,
      });
      continue;
    }

    try {
      await sendOneEmail({
        toEmail: p.email,
        subject: p.finalSubject,
        body: p.finalBody,
        attachmentAbsPath: s.resumePath,
      });
      const now = new Date().toISOString();
      updateProfessor(p.id, {
        status: "sent",
        sentAt: now,
        errorMessage: null,
      });
      recordSent({
        timestamp: now,
        professorId: p.id,
        professorName: p.professorName,
        email: p.email,
        subject: p.finalSubject,
      });
      logger.email("Sent", { email: p.email, subject: p.finalSubject });
      result.sent += 1;
      result.details.push({
        professorId: p.id,
        email: p.email,
        status: "sent",
      });
    } catch (err) {
      const msg = (err as Error).message;
      setStatus(p.id, "failed", { errorMessage: msg });
      recordFailed({
        timestamp: new Date().toISOString(),
        professorId: p.id,
        professorName: p.professorName,
        email: p.email,
        subject: p.finalSubject || undefined,
        errorMessage: msg,
      });
      logger.error("Send failed", { email: p.email, err: msg });
      result.failed += 1;
      result.details.push({
        professorId: p.id,
        email: p.email,
        status: "failed",
        error: msg,
      });
    }

    if (i < targets.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return result;
}
