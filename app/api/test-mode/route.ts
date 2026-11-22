import { NextRequest, NextResponse } from "next/server";
import { seedTestData, TEST_COOKIE } from "@/lib/test-mode";
import { PUBLIC_DEMO } from "@/lib/paths";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Turn test data mode on (fresh fixtures), reset it, or switch back to your own data. */
export async function POST(req: NextRequest) {
  const { mode } = (await req.json().catch(() => ({}))) as { mode?: "on" | "reset" | "off" };
  const res = NextResponse.json({ ok: true });
  if (mode === "off" && PUBLIC_DEMO) {
    return NextResponse.json({ error: "This public demo only has test data." }, { status: 403 });
  }
  if (mode === "off") {
    res.cookies.delete(TEST_COOKIE);
  } else {
    seedTestData();
    res.cookies.set(TEST_COOKIE, "1", { path: "/", sameSite: "lax" });
  }
  return res;
}
