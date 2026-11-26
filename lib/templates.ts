"use client";

/**
 * Email templates: a few starters for different kinds of outreach, plus your own. The one marked "in use"
 * is what new drafts are written with (sent along with the draft request). Kept in this browser.
 */
export type Template = { id: string; name: string; use: string; subject: string; body: string; custom?: boolean };

export const STARTERS: Template[] = [
  { id: "design-partners", name: "Design partners", use: "Early users who'll shape the product",
    subject: "A quick question for you, {{first_name}}",
    body: `Hi {{first_name}},

{{personalized_lines}}

I'm Sameer, and I run Ledgerly, a 12-person fintech team in Bengaluru. We're building a tool that predicts which payment mandates will fail and retries them at the right hour, and we're looking for a few people to shape it with us early.

Would you be open to a 20-minute call in the next couple of weeks? I'll keep it to the point.

Thanks,
Sameer` },
  { id: "customer-interview", name: "Customer interview", use: "Learn how someone works today",
    subject: "15 minutes on how {{company}} handles this?",
    body: `Hi {{first_name}},

{{personalized_lines}}

I'm researching how teams like yours deal with failed recurring payments, and I'm not selling anything. Could I ask you five questions in a 15-minute call?

Thank you,
Sameer` },
  { id: "podcast-guest", name: "Podcast guest", use: "Invite someone onto a show",
    subject: "Would you join us on the show, {{first_name}}?",
    body: `Hi {{first_name}},

{{personalized_lines}}

We run a small podcast on building fintech products, and we'd love to have you on for an episode. It's a 40-minute conversation, recorded remotely, whenever suits you next month.

Would you be up for it?

Sameer` },
  { id: "investor-intro", name: "Investor intro", use: "First note to an investor",
    subject: "{{first_name}}, a fintech infra company you may like",
    body: `Hi {{first_name}},

{{personalized_lines}}

Ledgerly predicts which payment mandates will fail and retries them at the right hour. We're live with three design partners and raising a seed round.

Could I send you a short deck, or take 20 minutes of your time?

Best,
Sameer` },
  { id: "referral", name: "Job referral", use: "Ask about a role, politely",
    subject: "A question about the team at {{company}}",
    body: `Hi {{first_name}},

{{personalized_lines}}

I'm a product designer applying to the payments team at {{company}}, and I'd value ten minutes of your view on what the team cares about most. I've attached a one-pager on my recent work.

Thank you for reading,
Sameer` },
];

const KEY = "warmline-templates";
const ACTIVE = "warmline-template-active";

export function getCustom(): Template[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function saveCustom(list: Template[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); window.dispatchEvent(new Event("warmline-templates")); } catch { /* not remembered */ }
}
export function getActiveId(): string {
  try { return localStorage.getItem(ACTIVE) || STARTERS[0].id; } catch { return STARTERS[0].id; }
}
export function setActiveId(id: string) {
  try { localStorage.setItem(ACTIVE, id); window.dispatchEvent(new Event("warmline-templates")); } catch { /* not remembered */ }
}
export function getActive(): Template {
  const id = getActiveId();
  return [...STARTERS, ...getCustom()].find((t) => t.id === id) ?? STARTERS[0];
}
