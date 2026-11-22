import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { PATHS } from "./paths";
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
  try {
    return cookies().get(TEST_COOKIE)?.value === "1";
  } catch {
    return false; // outside a request (scripts, startup)
  }
}

export const TEST_SUBJECT = "Research internship, summer 2027: {{professor_name}}, {{university}}";
export const TEST_TEMPLATE = `Dear Professor {{professor_name}},

I'm Riya Sharma, a third-year B.Tech student in Computer Science at NIT Trichy.

{{personalized_lines}}

I'd be grateful for the chance to work in your group as a research intern from May to July 2027. I'm comfortable with Python, PyTorch and reading papers closely, and I've attached my resume.

Thank you for reading. I'd be glad to talk at a time that suits you.

Best regards,
Riya Sharma
+91 98765 43210
riyasharma.dev`;

/** What test mode writes instead of calling Gemini. */
export function fakeLines(p: { researchArea?: string | null; department?: string | null; notes?: string | null }): string {
  const area = (p.researchArea || p.department || "your group's research").toLowerCase();
  const note = p.notes ? ` I was especially interested to read about ${p.notes.charAt(0).toLowerCase()}${p.notes.slice(1).replace(/\.$/, "")}.` : "";
  return `I have been reading about ${area}, and your group's approach to it is close to what I want to work on next.${note} I would like to learn how your lab frames these problems in practice.`;
}

const PEOPLE: Omit<ProfessorRecord, "id" | "createdAt" | "updatedAt" | "finalSubject" | "finalBody" | "personalizedLines">[] = [
  { professorName: "Ananya Iyer", university: "IISc Bengaluru", email: "ananya.iyer@example.com", department: "Computational and Data Sciences", researchArea: "Graph neural networks for molecular property prediction", labWebsite: "example.com/ananya-lab", notes: "Recent work on drug discovery with very little labelled data", status: "drafted" },
  { professorName: "Vikram Nair", university: "IIT Madras", email: "vikram.nair@example.com", department: "Computer Science", researchArea: "Speech recognition for Indian languages", labWebsite: null, notes: "Runs an open dataset of Tamil and Malayalam speech", status: "drafted" },
  { professorName: "Meera Krishnan", university: "IIT Delhi", email: "meera.krishnan@example.com", department: "Electrical Engineering", researchArea: "Low-power hardware for on-device ML", labWebsite: "example.com/meera", notes: null, status: "approved" },
  { professorName: "Arjun Rao", university: "IIIT Hyderabad", email: "arjun.rao@example.com", department: "Robotics Research Centre", researchArea: "Navigation for low-cost delivery robots", labWebsite: null, notes: null, status: "sent" },
  { professorName: "Kavya Menon", university: "IIT Bombay", email: "kavya.menon@example.com", department: "Civil Engineering", researchArea: "Satellite data for flood mapping", labWebsite: null, notes: "Worked on the 2024 Assam flood maps", status: "sent" },
  { professorName: "Sandeep Gupta", university: "IIT Kanpur", email: "sandeep.gupta@example", department: "Mathematics", researchArea: "Optimisation for large-scale learning", labWebsite: null, notes: null, status: "failed" },
  { professorName: "Neha Bhatt", university: "IISER Pune", email: "neha.bhatt@example.com", department: "Biology", researchArea: "Protein folding simulations", labWebsite: null, notes: null, status: "pending" },
  { professorName: "Rohan Mehta", university: "BITS Pilani", email: "rohan.mehta@example.com", department: "Economics", researchArea: null, labWebsite: null, notes: null, status: "pending" },
];

/** Hand-written sample lines for the seeded drafts, so the demo reads like real Gemini output. */
const SAMPLE_LINES: Record<string, string> = {
  "Ananya Iyer": "I read your recent work on predicting molecular properties when only a handful of compounds are labelled, and the idea of getting useful signal from so little data stayed with me. I've been trying small graph models on public molecule datasets and would love to learn how your group decides what to label next.",
  "Vikram Nair": "Your open dataset of Tamil and Malayalam speech is the reason I started looking at speech recognition for Indian languages. I've been training small models on it for a class project, and I'd love to understand how your group handles the code-mixed speech that most benchmarks leave out.",
  "Meera Krishnan": "Your group's work on running ML on very low-power hardware is close to what I keep running into: my models work on a laptop and fall over on a microcontroller. I'd like to learn how you decide what to cut first.",
  "Arjun Rao": "I've been following your lab's work on navigation for low-cost delivery robots, especially the focus on cheap sensors over expensive ones. I built a small line-following robot last year and would like to learn how far that idea can go outdoors.",
  "Kavya Menon": "Your flood maps from the 2024 Assam floods were the first time I saw satellite data used that quickly for people on the ground. I've worked a little with Sentinel-1 images and would like to learn how your group turns them into maps people can act on.",
  "Sandeep Gupta": "I've been reading about optimisation methods that scale to very large models, and your group's work came up again and again. I'd like to learn how you choose between speed and stability when the model no longer fits on one machine.",
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
    const vars = { professor_name: p.professorName, university: p.university, personalized_lines: lines };
    const rec: ProfessorRecord = {
      ...p,
      id,
      personalizedLines: lines,
      finalSubject: hasDraft ? renderTemplate(TEST_SUBJECT, vars) : null,
      finalBody: hasDraft ? renderTemplate(TEST_TEMPLATE, vars) : null,
      approved: p.status === "approved" || p.status === "sent",
      sentAt: p.status === "sent" ? iso(4 + i * 20) : null,
      errorMessage: p.status === "failed" ? "No recipients defined: the address has no domain ending (example)." : null,
      createdAt: iso(100 - i),
      updatedAt: iso(50 - i),
    };
    const log = { timestamp: rec.sentAt || iso(30), professorId: id, professorName: p.professorName, email: p.email, subject: rec.finalSubject || undefined };
    if (p.status === "sent") sent.push({ ...log, status: "sent" });
    if (p.status === "failed") failed.push({ ...log, status: "failed", errorMessage: rec.errorMessage || "" });
    return rec;
  });

  const write = (f: string, d: unknown) => fs.writeFileSync(f, JSON.stringify(d, null, 2));
  write(TEST_PATHS.generatedEmails, records);
  write(TEST_PATHS.sentLogs, sent);
  write(TEST_PATHS.failedLogs, failed);
}
