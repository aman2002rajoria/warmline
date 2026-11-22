import { NextRequest, NextResponse } from "next/server";
import { bulkSend } from "@/services/email.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body.professorIds)
      ? body.professorIds
      : [];
    if (ids.length === 0) {
      return NextResponse.json(
        { error: "professorIds array is required" },
        { status: 400 },
      );
    }
    const result = await bulkSend(ids);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Send failed" },
      { status: 500 },
    );
  }
}
