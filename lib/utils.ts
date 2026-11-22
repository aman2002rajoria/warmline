import { clsx, type ClassValue } from "clsx";

/**
 * Join class names. Plain clsx (no tailwind-merge): the custom type scale
 * (text-h1, text-body-s…) shares the text-* prefix with colours, and
 * tailwind-merge would drop one of them.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

/** Substitute {{var}} tokens in a template string. */
export function renderTemplate(
  template: string,
  vars: Record<string, string | undefined | null>,
): string {
  return template.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_m, key) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

/** Stable ID from an email (lowercase, deterministic). */
export function idFromEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** Mask a secret for display: keep last 4 chars, replace rest with bullets. */
export function maskSecret(s: string | null | undefined, keep = 4): string {
  if (!s) return "";
  if (s.length <= keep) return "•".repeat(s.length);
  return "•".repeat(Math.max(4, s.length - keep)) + s.slice(-keep);
}
