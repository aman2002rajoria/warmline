/** Date and time formats from design.md §4: "15 Nov 2026, 5:30 pm". */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = typeof v === "string" ? new Date(v) : v;
  return isNaN(d.getTime()) ? null : d;
}

export function fmtTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "am" : "pm"}`;
}

export function fmtDate(v: string | Date | null | undefined, withYear = true): string {
  const d = toDate(v);
  if (!d) return "";
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return withYear && d.getFullYear() !== new Date().getFullYear()
    ? `${base} ${d.getFullYear()}`
    : base;
}

export function fmtDateTime(v: string | Date | null | undefined): string {
  const d = toDate(v);
  if (!d) return "";
  return `${fmtDate(d)}, ${fmtTime(d)}`;
}

/** Relative time, for feeds only. */
export function fmtAgo(v: string | Date | null | undefined): string {
  const d = toDate(v);
  if (!d) return "";
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(d);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString("en-IN")} ${n === 1 ? one : many}`;
}
