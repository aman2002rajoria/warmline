import { isTestMode } from "@/lib/test-mode";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PATHS, ensureProjectFolders, toProjectRelative } from "@/lib/paths";
import { saveSettings } from "@/lib/settings-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (isTestMode()) {
    return NextResponse.json({ error: "Settings can't be changed in test mode. Switch to your own data first." }, { status: 403 });
  }
  try {
    ensureProjectFolders();
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const originalName = (file as File).name || "resume.pdf";
    if (!/\.pdf$/i.test(originalName)) {
      return NextResponse.json(
        { error: "Resume must be a PDF file" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await (file as File).arrayBuffer());
    const safeName = `resume__${Date.now()}.pdf`;
    const abs = path.join(PATHS.uploadsResumes, safeName);
    fs.writeFileSync(abs, buffer);

    // Store as a project-relative path so it stays portable across machines.
    const rel = toProjectRelative(abs);
    saveSettings({ resumePath: rel });

    return NextResponse.json({ ok: true, resumePath: rel });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Upload failed" },
      { status: 500 },
    );
  }
}
