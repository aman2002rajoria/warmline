import { NextRequest, NextResponse } from "next/server";
import { getProfessor, updateProfessor } from "@/lib/professors-store";
import { buildEmail } from "@/services/email.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: { id: string };
}

/**
 * Rebuild the draft email using the CURRENT template + personalized lines
 * stored on the professor. Useful after the user edits the global template.
 */
export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const p = getProfessor(params.id);
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { subject, body } = buildEmail({
      professorName: p.professorName,
      university: p.university,
      personalizedLines: p.personalizedLines || "",
    });

    const updated = updateProfessor(p.id, {
      finalSubject: subject,
      finalBody: body,
      status: p.personalizedLines ? "drafted" : p.status,
    });
    return NextResponse.json({ professor: updated });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Failed" },
      { status: 500 },
    );
  }
}
