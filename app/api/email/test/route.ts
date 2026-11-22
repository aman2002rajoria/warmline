import { isTestMode } from "@/lib/test-mode";
import { NextRequest, NextResponse } from "next/server";
import { sendOneEmail, verifySmtp } from "@/services/email.service";
import { getSettings } from "@/lib/settings-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (isTestMode()) {
    return NextResponse.json({ error: "Settings can't be changed in test mode. Switch to your own data first." }, { status: 403 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const toEmail = ((body && body.toEmail) || "").trim();
    if (!toEmail) {
      const verify = await verifySmtp();
      return NextResponse.json(verify);
    }

    const s = getSettings();
    await sendOneEmail({
      toEmail,
      subject: "Test email from Research Email Automation",
      body: [
        "Hi,",
        "",
        "This is a test email from your local Research Email Automation tool.",
        "If you received this, your Gmail SMTP configuration is working.",
        "",
        `Sender: ${s.gmailEmail}`,
        `Sent at: ${new Date().toLocaleString()}`,
      ].join("\n"),
      attachmentAbsPath: s.resumePath,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
