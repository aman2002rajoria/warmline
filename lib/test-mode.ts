import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { PATHS, PUBLIC_DEMO } from "./paths";
import { renderTemplate } from "./utils";
import type { LogEntry, ProfessorRecord } from "@/types";

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

/** What test mode writes instead of calling Gemini. */
export function fakeLines(p: { researchArea?: string | null; department?: string | null; notes?: string | null }): string {
  const low = (t: string) => t.charAt(0).toLowerCase() + t.slice(1).replace(/\.$/, "");
  const note = p.notes ? ` ${p.notes.replace(/\.$/, "")} stuck with me too.` : "";
  if (p.researchArea) return `I came across your work on ${low(p.researchArea)}, and it's close to the problem we started from.${note}`;
  if (p.department) return `I've been following what you do as ${/^[aeiou]/i.test(p.department) ? "an" : "a"} ${low(p.department)}, and I think you'd see our problem from a useful angle.${note}`;
  return `I've been following the work your team is doing, and it's close to the problem we started from.${note}`;
}

/*
  Test people: anyone you might write to, not one kind. Field names are the app's originals:
  professorName = name, university = company, department = role, researchArea = what they work on,
  labWebsite = a link, notes = your notes.
*/
const PEOPLE: Omit<ProfessorRecord, "id" | "createdAt" | "updatedAt" | "finalSubject" | "finalBody" | "personalizedLines">[] = [
  { professorName: "Priya Menon", university: "Razorpay", email: "priya.menon@example.com", department: "Product Lead, Subscriptions", researchArea: "Why UPI AutoPay mandates fail at the bank step", labWebsite: "example.com/priya-autopay-talk", notes: "Gave a meetup talk on AutoPay drop-offs in October", status: "drafted" },
  { professorName: "Kabir Shah", university: "CRED", email: "kabir.shah@example.com", department: "Senior Product Manager", researchArea: "The bill-payments roadmap", labWebsite: null, notes: "Posted about reminders people actually open", status: "drafted" },
  { professorName: "Meera Iyer", university: "Zepto", email: "meera.iyer@example.com", department: "Head of Partnerships", researchArea: "Partnerships with local brands", labWebsite: "example.com/meera", notes: null, status: "approved" },
  { professorName: "Arjun Rao", university: "Kisaan Kart", email: "arjun.rao@example.com", department: "Founder, seed-stage agritech", researchArea: "Onboarding kirana owners who have never used an app", labWebsite: null, notes: "Uses voice notes heavily in sales", status: "sent" },
  { professorName: "Neha Gupta", university: "Swiggy", email: "neha.gupta@example.com", department: "Design Lead", researchArea: "Reorder habits on Instamart", labWebsite: null, notes: "Wrote a long piece on habit design", status: "sent" },
  { professorName: "Rohan Das", university: "Groww", email: "rohan.das@example", department: "Engineering Manager, Payments", researchArea: "Payments reliability at scale", labWebsite: null, notes: null, status: "failed" },
  { professorName: "Ananya Sen", university: "The Product Folks podcast", email: "ananya.sen@example.com", department: "Host", researchArea: "Interviews with first-time product managers", labWebsite: null, notes: null, status: "pending" },
  { professorName: "Vikram Nair", university: "Independent", email: "vikram.nair@example.com", department: "Recruiter for early-stage startups", researchArea: null, labWebsite: null, notes: null, status: "pending" },
];

/** Hand-written sample lines for the seeded drafts, so the demo reads like real Gemini output. */
const SAMPLE_LINES: Record<string, string> = {
  "Priya Menon": "I watched your talk on why UPI AutoPay mandates fail at the bank step. It described the exact problem we started from.",
  "Kabir Shah": "Your post about building reminders people actually open made me rethink how we nudge users before a payment is due.",
  "Meera Iyer": "The way Zepto has brought local brands onto quick commerce is close to what we want to learn from: small partners, very fast.",
  "Arjun Rao": "Your post about onboarding kirana owners who have never used an app caught my eye, especially the voice-note approach.",
  "Neha Gupta": "Your piece on reorder habits on Instamart is the clearest explanation of habit design I've read this year.",
  "Rohan Das": "I've been reading how your team keeps payments reliable at Groww's scale, and it's the part of our product we worry about most.",
};

/** Write fresh fixtures to data/test-mode/. */
export function seedTestData() {
  fs.mkdirSync(DIR, { recursive: true });
  const now = Date.now();
  const iso = (hoursAgo: number) => new Date(now - hoursAgo * 3600_000).toISOString();

  const sent: LogEntry[] = [];
  const failed: LogEntry[] = [];
  const records: ProfessorRecord[] = PEOPLE.map((p, i) => {
    const id = p.email.replace(/[^a-z0-9]+/g, "-");
    const hasDraft = p.status !== "pending";
    const lines = hasDraft ? SAMPLE_LINES[p.professorName] ?? fakeLines(p) : null;
    const vars = { first_name: p.professorName.split(" ")[0], name: p.professorName, company: p.university, professor_name: p.professorName, university: p.university, personalized_lines: lines };
    const rec: ProfessorRecord = {
      ...p,
      id,
      personalizedLines: lines,
      finalSubject: hasDraft ? renderTemplate(TEST_SUBJECT, vars) : null,
      finalBody: hasDraft ? renderTemplate(TEST_TEMPLATE, vars) : null,
      approved: p.status === "approved" || p.status === "sent",
      sentAt: p.status === "sent" ? iso(4 + i * 20) : null,
      errorMessage: p.status === "failed" ? "No recipients defined: the address has no domain ending (rohan.das@example)." : null,
      createdAt: iso(100 - i),
      updatedAt: iso(50 - i),
    };
    const log = { timestamp: rec.sentAt || iso(30), professorId: id, professorName: p.professorName, email: p.email, subject: rec.finalSubject || undefined };
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
