"use client";

/**
 * A visitor's own Gemini key. It lives only in this browser (localStorage) and is sent with each
 * "write draft" request in the x-gemini-key header. The server uses it for that one call and never saves it.
 */
const KEY = "warmline_gemini_key";

export function getOwnKey(): string {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

export function setOwnKey(v: string) {
  try {
    if (v.trim()) localStorage.setItem(KEY, v.trim());
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("warmline-key"));
  } catch {
    /* private mode: the key just isn't remembered */
  }
}

export function keyHeader(): Record<string, string> {
  const k = getOwnKey();
  return k ? { "x-gemini-key": k } : {};
}
