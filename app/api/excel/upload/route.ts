import { isTestMode } from "@/lib/test-mode";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { importProfessors, parseExcelBuffer } from "@/services/excel.service";
import { PATHS, ensureProjectFolders } from "@/lib/paths";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (isTestMode()) {
    return NextResponse.json({ error: "Importing is off in test mode. Switch to your own data to import a sheet." }, { status: 403 });
  }
  try {
    ensureProjectFolders();

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const originalName = (file as File).name || "upload.xlsx";
    if (!/\.xlsx?$/i.test(originalName)) {
      return NextResponse.json(
        { error: "File must be .xlsx or .xls" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await (file as File).arrayBuffer());

    // Archive a copy of the uploaded sheet for traceability.
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const savePath = path.join(PATHS.uploadsExcel, `${stamp}__${originalName}`);
    fs.writeFileSync(savePath, buffer);

    // Also overwrite the canonical data/professors.xlsx (mirror of latest upload).
    fs.writeFileSync(PATHS.professorsXlsx, buffer);

    const parsed = parseExcelBuffer(buffer);
    const result = importProfessors(parsed);
    logger.info("Excel imported", result);

    return NextResponse.json({
      ok: true,
      archivedAs: path.relative(PATHS.root, savePath).split(path.sep).join("/"),
      ...result,
    });
  } catch (err) {
    logger.error("Excel import failed", { err: (err as Error).message });
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
