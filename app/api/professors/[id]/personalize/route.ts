import { NextRequest, NextResponse } from "next/server";
import { getProfessor, updateProfessor } from "@/lib/professors-store";
import { generatePersonalization } from "@/services/gemini.service";
import { buildEmail } from "@/services/email.service";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "1";
    const sent = (await req.json().catch(() => ({}))) as { template?: { subject?: unknown; body?: unknown } };
    const template =
      typeof sent.template?.subject === "string" && typeof sent.template?.body === "string" && sent.template.body.includes("{{personalized_lines}}")
        ? { subject: sent.template.subject.slice(0, 300), body: sent.template.body.slice(0, 6000) }
        : undefined;

    const p = getProfessor(params.id);
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let lines = p.personalizedLines || null;
    let aiSubject: string | undefined;
    if (!lines || force) {
      const result = await generatePersonalization(
        {
          email: p.email,
          professorName: p.professorName,
          university: p.university,
          department: p.department,
          labWebsite: p.labWebsite,
          researchArea: p.researchArea,
          notes: p.notes,
        },
        { force, apiKey: req.headers.get("x-gemini-key") || undefined },
      );
      lines = result.lines;
      aiSubject = result.subject;
    }

    const { subject, body } = buildEmail({
      professorName: p.professorName,
      university: p.university,
      personalizedLines: lines || "",
      subject: aiSubject,
      template,
    });

    const updated = updateProfessor(p.id, {
      personalizedLines: lines,
      finalSubject: subject,
      finalBody: body,
      status: "drafted",
    });

    return NextResponse.json({ professor: updated });
  } catch (err) {
    logger.error("Personalize failed", { err: (err as Error).message });
    return NextResponse.json(
      { error: (err as Error).message || "Personalization failed" },
      { status: 500 },
    );
  }
}
