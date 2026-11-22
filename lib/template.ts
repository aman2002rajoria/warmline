/** Placeholders like [YOUR NAME] still left in the template. Safe for client and server. */
export function findPlaceholders(text: string): string[] {
  const found = text.match(/\[[A-Z][A-Z0-9 /&'.-]{2,}\]/g) ?? [];
  return Array.from(new Set(found));
}
