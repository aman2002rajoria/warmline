import { NextRequest, NextResponse } from "next/server";
import { pingGemini } from "@/services/gemini.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Checks a visitor's own Gemini key (sent in a header, never stored). */
export async function POST(req: NextRequest) {
  const key = req.headers.get("x-gemini-key") || "";
  if (!key.trim()) return NextResponse.json({ ok: false, message: "Paste a key first." });
  return NextResponse.json(await pingGemini(key));
}
