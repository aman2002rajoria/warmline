import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { PATHS, PUBLIC_DEMO } from "./paths";
import { renderTemplate } from "./utils";
import type { LogEntry, ProfessorRecord } from "@/types";
import { PEOPLE } from "./demo-people";

/**
 * Test data mode (design.md §16): anyone can try the app with realistic
 * fixtures and no setup. While the `warmline_test` cookie is set:
 *   - professors and logs are read from data/test-mode/ instead of data/
 *   - Gemini is not called (canned lines are written from the details)
 *   - nothing is emailed (sends are simulated)
 *   - settings can't be changed
 */
export const TEST_COOKIE = "warmline_test";
const DIR = path.join(PATHS.data, "test-mode");

export const TEST_PATHS = {
  generatedEmails: path.join(DIR, "generated_emails.json"),
  sentLogs: path.join(DIR, "sent_logs.json"),
  failedLogs: path.join(DIR, "failed_logs.json"),
};

export function isTestMode(): boolean {
  if (PUBLIC_DEMO) {
    // The public demo is always on test data, built the first time it's needed.
    if (!fs.existsSync(TEST_PATHS.generatedEmails)) seedTestData();
    return true;
  }
  try {
    return cookies().get(TEST_COOKIE)?.value === "1";
  } catch {
    return false; // outside a request (scripts, startup)
  }
}

export const TEST_SUBJECT = "A quick question for you, {{first_name}}";
export const TEST_TEMPLATE = `Hi {{first_name}},

{{personalized_lines}}

I'm Sameer, and I run Ledgerly, a 12-person fintech team in Bengaluru. We're building a tool that predicts which payment mandates will fail and retries them at the right hour, and we're looking for a few people to shape it with us early.

Would you be open to a 20-minute call in the next couple of weeks? I'll keep it to the point.

Thanks,
Sameer
Founder, Ledgerly`;

/** A subject that points at the hook, so it reads as written for this one person. */
export function fakeSubject(p: { professorName: string; researchArea?: string | null; department?: string | null }): string {
  const first = p.professorName.split(" ")[0];
  const area = p.researchArea?.replace(/\.$/, "");
  if (!area) return `A quick question for you, ${first}`;
  const words = area.split(/\s+/);
  const short = words.length > 7 ? `${words.slice(0, 7).join(" ")}…` : area;
  return `${first}, a question about ${short.charAt(0).toLowerCase()}${short.slice(1)}`;
}

/** What test mode writes instead of calling Gemini. */
export function fakeLines(p: { researchArea?: string | null; department?: string | null; notes?: string | null }): string {
  const low = (t: string) => t.charAt(0).toLowerCase() + t.slice(1).replace(/\.$/, "");
  const note = p.notes ? ` ${p.notes.replace(/\.$/, "")} stuck with me too.` : "";
  if (p.researchArea) return `I came across your work on ${low(p.researchArea)}, and it's close to the problem we started from.${note}`;
  if (p.department) return `I've been following what you do as ${/^[aeiou]/i.test(p.department) ? "an" : "a"} ${low(p.department)}, and I think you'd see our problem from a useful angle.${note}`;
  return `I've been following the work your team is doing, and it's close to the problem we started from.${note}`;
}

/** Write fresh fixtures to data/test-mode/. */
export function seedTestData() {
  fs.mkdirSync(DIR, { recursive: true });
  const now = Date.now();
  const iso = (hoursAgo: number) => new Date(now - hoursAgo * 3600_000).toISOString();

  const sent: LogEntry[] = [];
  const failed: LogEntry[] = [];
  const records: ProfessorRecord[] = PEOPLE.map((d, i) => {
    const { links: _l, activity: _a, sentHoursAgo, scheduleInHours, followUpInHours, lines: sample, ...p } = d;
    const id = p.email.replace(/[^a-z0-9]+/g, "-");
    const hasDraft = p.status !== "pending";
    const lines = hasDraft ? sample ?? fakeLines(p) : null;
    const vars = { first_name: p.professorName.split(" ")[0], name: p.professorName, company: p.university, professor_name: p.professorName, university: p.university, personalized_lines: lines };
    const at = (h: number) => new Date(now + h * 3600_000).toISOString();
    const rec: ProfessorRecord = {
      ...p,
      id,
      personalizedLines: lines,
      finalSubject: hasDraft ? fakeSubject(p) : null,
      finalBody: hasDraft ? renderTemplate(TEST_TEMPLATE, vars) : null,
      approved: p.status === "approved" || p.status === "sent",
      sentAt: p.status === "sent" && sentHoursAgo ? iso(sentHoursAgo) : null,
      scheduledAt: scheduleInHours ? at(scheduleInHours) : null,
      followUpAt: followUpInHours ? at(followUpInHours) : null,
      attachments: p.status === "approved" ? [{ name: "Ledgerly-one-pager.pdf", size: 184_320 }] : [],
      errorMessage: p.status === "failed" ? `No recipients defined: the address has no domain ending (${p.email}).` : null,
      createdAt: iso(200 - i),
      updatedAt: iso(60 - i),
    };
    const log = { timestamp: rec.sentAt || iso(sentHoursAgo || 30), professorId: id, professorName: p.professorName, email: p.email, subject: rec.finalSubject || undefined };
    if (p.status === "sent") sent.push({ ...log, status: "sent" });
    if (p.status === "failed") failed.push({ ...log, status: "failed", errorMessage: rec.errorMessage || "" });
    return rec;
  });

  // Write to a temp file and rename, so a page reading at the same moment never sees half a file.
  const write = (f: string, d: unknown) => {
    const tmp = `${f}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(d, null, 2));
    fs.renameSync(tmp, f);
  };
  write(TEST_PATHS.sentLogs, sent);
  write(TEST_PATHS.failedLogs, failed);
  write(TEST_PATHS.generatedEmails, records); // last: its presence means the seed is complete
}
