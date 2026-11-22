import { NextRequest, NextResponse } from "next/server";
import { readAllLogs, readSent, readFailed } from "@/lib/logs-store";
import { PATHS } from "@/lib/paths";
import { tailLog } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") || "all";

  if (kind === "sent") return NextResponse.json({ entries: readSent().reverse() });
  if (kind === "failed") return NextResponse.json({ entries: readFailed().reverse() });
  if (kind === "errors-log") {
    return NextResponse.json({ lines: tailLog(PATHS.logErrors, 500) });
  }
  if (kind === "app-log") {
    return NextResponse.json({ lines: tailLog(PATHS.logApp, 500) });
  }
  return NextResponse.json({ entries: readAllLogs() });
}
