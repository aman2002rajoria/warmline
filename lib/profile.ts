"use client";

/**
 * The sender's profile: who you are, and the signature card that ends every email.
 * In the public demo it lives in this browser (localStorage); it starts as Sameer from the case study.
 */
export type Profile = {
  name: string;
  role: string;
  company: string;
  link: string;
  phone: string;
  /** A photo of you, or your company logo (a data URL or a path). */
  photo: string;
  logo: string;
  /** Add the signature card to the end of every email. */
  signature: boolean;
};

export const DEFAULT_PROFILE: Profile = {
  name: "Sameer Khanna",
  role: "Founder",
  company: "Ledgerly",
  link: "ledgerly.example.com",
  phone: "",
  photo: "/art/P-sameer.webp",
  logo: "",
  signature: true,
};

const KEY = "warmline-profile";

export function getProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    window.dispatchEvent(new Event("warmline-profile"));
  } catch {
    /* too big or private mode: not remembered */
  }
}

/** Reads a small image file into a data URL (the demo keeps it in the browser). */
export function readImage(file: File, maxKB = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Pick an image (PNG, JPG or WebP)."));
    if (file.size > maxKB * 1024) return reject(new Error(`Keep it under ${maxKB} KB.`));
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Couldn't read that file."));
    r.readAsDataURL(file);
  });
}
