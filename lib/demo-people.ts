/*
  THE DEMO CAST. Sameer runs Ledgerly (a 12-person fintech team) and is writing to people he doesn't know yet:
  product leads, founders, a VC, a podcast host, a recruiter. Everything here is made up; links point at example.com.
  Shared by the server (to seed test data) and the screens (to show what each line was based on, and the replies).
  Field names follow the app's originals: professorName = name, university = company, department = role,
  researchArea = what they work on, labWebsite = a link, notes = your notes.
*/
import type { ProfessorStatus } from "@/types";

export type Channel = "gmail" | "linkedin" | "x";
export type ActivityKind = "talk" | "post" | "article" | "news" | "podcast";
export type Activity = { kind: ActivityKind; source: string; text: string; when: string; url?: string; hook?: boolean };
export type Links = { linkedin?: string; x?: string; website?: string };

export type DemoPerson = {
  professorName: string;
  university: string;
  email: string;
  department: string | null;
  researchArea: string | null;
  labWebsite: string | null;
  notes: string | null;
  status: ProfessorStatus;
  /** hours ago it was sent; negative = hours from now it's scheduled for */
  sentHoursAgo?: number;
  scheduleInHours?: number;
  followUpInHours?: number;
  lines?: string;
  links: Links;
  activity: Activity[];
};

const ex = (slug: string) => `https://example.com/${slug}`;

export const PEOPLE: DemoPerson[] = [
  {
    professorName: "Priya Menon", university: "Razorpay", email: "priya.menon@example.com", department: "Product Lead, Subscriptions",
    researchArea: "Why UPI AutoPay mandates fail at the bank step", labWebsite: ex("priya-autopay-talk"), notes: "Gave a meetup talk on AutoPay drop-offs in October",
    status: "sent", sentHoursAgo: 70,
    lines: "I watched your talk on why UPI AutoPay mandates fail at the bank step. It described the exact problem we started from.",
    links: { linkedin: ex("linkedin/priya-menon"), x: ex("x/priyamenon"), website: ex("priya-autopay-talk") },
    activity: [
      { kind: "talk", source: "Fintech Meetup · YouTube", text: "Why UPI AutoPay mandates fail at the bank step", when: "12 Oct", url: ex("priya-autopay-talk"), hook: true },
      { kind: "post", source: "LinkedIn", text: "Retries are our biggest open problem this quarter.", when: "3 weeks ago", url: ex("linkedin/priya-menon/post") },
      { kind: "news", source: "Economic Times", text: "Razorpay widens recurring payments for small merchants", when: "2 months ago" },
    ],
  },
  {
    professorName: "Kabir Shah", university: "CRED", email: "kabir.shah@example.com", department: "Senior Product Manager",
    researchArea: "Bill reminders people actually open", labWebsite: null, notes: "Posted about timing reminders around payday",
    status: "sent", sentHoursAgo: 46,
    lines: "Your post about timing bill reminders around when people actually get paid made me rethink how we nudge users before a payment is due.",
    links: { linkedin: ex("linkedin/kabir-shah"), x: ex("x/kabirshah") },
    activity: [
      { kind: "post", source: "LinkedIn", text: "We rebuilt bill reminders around when people actually get paid.", when: "2 weeks ago", url: ex("linkedin/kabir-shah/post"), hook: true },
      { kind: "podcast", source: "The Product Folks", text: "Building habits in fintech, episode 38", when: "1 month ago" },
    ],
  },
  {
    professorName: "Meera Iyer", university: "Zepto", email: "meera.iyer@example.com", department: "Head of Partnerships",
    researchArea: "Bringing local brands onto quick commerce", labWebsite: ex("meera-brands"), notes: null,
    status: "sent", sentHoursAgo: 120,
    lines: "Your piece on onboarding local brands in 48 hours is close to what we want to learn from: small partners, moving very fast.",
    links: { linkedin: ex("linkedin/meera-iyer"), website: ex("meera-brands") },
    activity: [
      { kind: "article", source: "Medium", text: "How we onboard local brands in 48 hours", when: "5 weeks ago", url: ex("meera-brands"), hook: true },
      { kind: "post", source: "LinkedIn", text: "Hiring partnership managers in Bengaluru.", when: "1 week ago" },
    ],
  },
  {
    professorName: "Neha Gupta", university: "Swiggy", email: "neha.gupta@example.com", department: "Design Lead",
    researchArea: "Reorder habits on Instamart", labWebsite: null, notes: "Wrote a long piece on habit design",
    status: "sent", sentHoursAgo: 150,
    lines: "Your piece on designing for the reorder is the clearest explanation of habit design I've read this year.",
    links: { linkedin: ex("linkedin/neha-gupta"), website: ex("neha-reorder") },
    activity: [
      { kind: "article", source: "Medium", text: "Designing for the reorder", when: "1 month ago", url: ex("neha-reorder"), hook: true },
      { kind: "talk", source: "Config India", text: "Habit loops in quick commerce", when: "3 months ago" },
    ],
  },
  {
    professorName: "Arjun Rao", university: "Kisaan Kart", email: "arjun.rao@example.com", department: "Founder, seed-stage agritech",
    researchArea: "Onboarding kirana owners who have never used an app", labWebsite: null, notes: "Uses voice notes heavily in sales",
    status: "sent", sentHoursAgo: 100, followUpInHours: 20,
    lines: "Your post about onboarding kirana owners who have never used an app caught my eye, especially the voice-note approach.",
    links: { linkedin: ex("linkedin/arjun-rao"), x: ex("x/arjunrao") },
    activity: [
      { kind: "post", source: "LinkedIn", text: "Onboarding kirana owners who've never used an app: what worked.", when: "10 days ago", url: ex("linkedin/arjun-rao/post"), hook: true },
      { kind: "podcast", source: "Startup Talky", text: "Voice notes as a sales channel", when: "2 months ago" },
    ],
  },
  {
    professorName: "Rohan Das", university: "Groww", email: "rohan.das@example", department: "Engineering Manager, Payments",
    researchArea: "Keeping payments up on the busiest nights", labWebsite: null, notes: null,
    status: "failed", sentHoursAgo: 30,
    lines: "Your engineering post on keeping payments up during IPL night is the part of our product we worry about most.",
    links: { linkedin: ex("linkedin/rohan-das") },
    activity: [
      { kind: "article", source: "Groww engineering blog", text: "Keeping payments up during IPL night", when: "6 weeks ago", url: ex("groww-ipl"), hook: true },
    ],
  },
  {
    professorName: "Ishaan Kapoor", university: "PhonePe", email: "ishaan.kapoor@example.com", department: "Growth Lead",
    researchArea: "Why a UPI Lite rollout went slower than planned", labWebsite: null, notes: null,
    status: "approved", scheduleInHours: 18,
    lines: "Your honest post on why the UPI Lite rollout went slower than planned is the kind of lesson we'd love to learn before we ship.",
    links: { linkedin: ex("linkedin/ishaan-kapoor"), x: ex("x/ishaankapoor") },
    activity: [
      { kind: "post", source: "LinkedIn", text: "Why our UPI Lite rollout went slower than planned.", when: "4 days ago", url: ex("linkedin/ishaan-kapoor/post"), hook: true },
      { kind: "talk", source: "SaaSBoomi", text: "Growth loops in payments", when: "2 months ago" },
    ],
  },
  {
    professorName: "Tara Bose", university: "Blume Ventures", email: "tara.bose@example.com", department: "Principal",
    researchArea: "What she looks for in fintech infrastructure", labWebsite: ex("tara-infra"), notes: null,
    status: "drafted",
    lines: "Your note on what you look for in fintech infrastructure read like a checklist for the problem we're working on.",
    links: { linkedin: ex("linkedin/tara-bose"), x: ex("x/tarabose"), website: ex("tara-infra") },
    activity: [
      { kind: "article", source: "Blume blog", text: "What we look for in fintech infrastructure", when: "3 weeks ago", url: ex("tara-infra"), hook: true },
      { kind: "post", source: "X", text: "Payments infra is having a moment. The boring layers matter.", when: "5 days ago" },
    ],
  },
  {
    professorName: "Dev Malhotra", university: "Jar", email: "dev.malhotra@example.com", department: "Head of Product",
    researchArea: "Daily savings streaks", labWebsite: null, notes: null,
    status: "drafted",
    lines: "Your post on what daily savings streaks taught Jar about habits is close to what we're seeing with recurring payments.",
    links: { linkedin: ex("linkedin/dev-malhotra") },
    activity: [
      { kind: "post", source: "LinkedIn", text: "What daily savings streaks taught us about habits.", when: "1 week ago", url: ex("linkedin/dev-malhotra/post"), hook: true },
    ],
  },
  {
    professorName: "Ananya Sen", university: "The Product Folks podcast", email: "ananya.sen@example.com", department: "Host",
    researchArea: "Interviews with first-time product managers", labWebsite: null, notes: null,
    status: "pending",
    links: { linkedin: ex("linkedin/ananya-sen"), website: ex("product-folks") },
    activity: [
      { kind: "podcast", source: "The Product Folks", text: "Episode 41: your first 90 days as a PM", when: "2 weeks ago", url: ex("product-folks/41"), hook: true },
    ],
  },
  {
    professorName: "Vikram Nair", university: "Independent", email: "vikram.nair@example.com", department: "Recruiter for early-stage startups",
    researchArea: null, labWebsite: null, notes: null,
    status: "pending",
    links: {},
    activity: [],
  },
];

export const byName = (name: string) => PEOPLE.find((p) => p.professorName === name);

/** Faces from the Warmline illustrations; everyone else gets initials. */
export const FACES: Record<string, string> = {
  "Priya Menon": "/art/P-priya.webp", "Kabir Shah": "/art/P-kabir.webp", "Meera Iyer": "/art/P-meera.webp", "Rohan Das": "/art/P-rohan.webp",
};

export type Lane = "interested" | "later" | "no";
export type Reply = { id: string; who: string; company: string; channel: Channel; lane: Lane; hoursAgo: number; text: string; answer: string };

export const REPLIES: Reply[] = [
  { id: "kabir", who: "Kabir Shah", company: "Senior PM, CRED", channel: "linkedin", lane: "interested", hoursAgo: 1,
    text: "Happy to chat. Thursday after 5 works. Send me what you want to cover?",
    answer: "Thursday 5:30 works, thank you! I'll send an invite with the three things I'd love to ask about how you time reminders." },
  { id: "priya", who: "Priya Menon", company: "Product Lead, Razorpay", channel: "gmail", lane: "interested", hoursAgo: 3,
    text: "This is timely, we've been looking at exactly this drop-off. Could you do next Tuesday?",
    answer: "Tuesday is perfect. Would 11 am or 4 pm suit you better? I'll bring the prototype and keep it to 20 minutes." },
  { id: "meera", who: "Meera Iyer", company: "Head of Partnerships, Zepto", channel: "gmail", lane: "later", hoursAgo: 26,
    text: "Not this quarter, we're heads-down on a launch. Try me in March?",
    answer: "Completely understand, good luck with the launch! I'll check back in early March." },
  { id: "neha", who: "Neha Gupta", company: "Design Lead, Swiggy", channel: "x", lane: "no", hoursAgo: 50,
    text: "Not the right person for this, sorry. Ravi on our payments team might be.",
    answer: "No problem at all, thanks for pointing me to Ravi. Would you be comfortable introducing us, or should I write to him directly?" },
];

export const CHANNEL_LABEL: Record<Channel, string> = { gmail: "Gmail", linkedin: "LinkedIn", x: "X" };

/** A short, polite nudge for someone who hasn't replied. */
export function followUpText(first: string, hook: string | null): string {
  return `Hi ${first}, just bringing this back to the top of your inbox${hook ? `. I'd still love your take on ${hook.charAt(0).toLowerCase()}${hook.slice(1).replace(/\.$/, "")}` : ""}. Twenty minutes, whenever suits you. No worries at all if now isn't a good time.`;
}
