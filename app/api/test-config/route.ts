import { NextResponse } from "next/server";
import { runFullTest } from "@/services/test-config.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await runFullTest();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Test failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return POST();
}
