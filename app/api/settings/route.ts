import { isTestMode } from "@/lib/test-mode";
import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings-store";
import { resetTransport } from "@/services/email.service";
import { maskSecret } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MASK_PREFIX = "•";

function maskForResponse(s: ReturnType<typeof getSettings>) {
  return {
    ...s,
    geminiApiKey: maskSecret(s.geminiApiKey),
    gmailAppPassword: s.gmailAppPassword ? "•••••••••••••" : "",
  };
}

export async function GET() {
  return NextResponse.json(maskForResponse(getSettings()));
}

export async function PUT(req: NextRequest) {
  if (isTestMode()) {
    return NextResponse.json({ error: "Settings can't be changed in test mode. Switch to your own data first." }, { status: 403 });
  }
  try {
    const body = await req.json();
    const allowed = [
      "geminiApiKey",
      "geminiModel",
      "gmailEmail",
      "gmailAppPassword",
      "smtpHost",
      "smtpPort",
      "senderName",
      "replyTo",
      "resumePath",
      "defaultDelaySeconds",
      "maxPerRun",
      "subjectTemplate",
      "bodyTemplate",
    ] as const;

    const patch: Record<string, unknown> = {};
    for (const k of allowed) {
      if (!(k in body)) continue;
      const v = body[k];

      // Don't overwrite secrets with their masked display value.
      if (
        (k === "geminiApiKey" || k === "gmailAppPassword") &&
        typeof v === "string" &&
        v.startsWith(MASK_PREFIX)
      ) {
        continue;
      }
      patch[k] = v ?? "";
    }

    const saved = saveSettings(patch);
    resetTransport(); // ensure SMTP picks up new credentials immediately
    return NextResponse.json({ ok: true, settings: maskForResponse(saved) });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Save failed" },
      { status: 500 },
    );
  }
}
