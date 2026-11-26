import { NextRequest, NextResponse } from "next/server";
import {
  deleteProfessors,
  getProfessor,
  updateProfessor,
} from "@/lib/professors-store";
import type { ProfessorRecord } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const p = getProfessor(params.id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ professor: p });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const body = (await req.json()) as Partial<ProfessorRecord>;
    const allowed: (keyof ProfessorRecord)[] = [
      "professorName",
      "university",
      "email",
      "department",
      "labWebsite",
      "researchArea",
      "notes",
      "personalizedLines",
      "finalSubject",
      "finalBody",
      "status",
      "approved",
      "scheduledAt",
      "attachments",
      "followUpAt",
      "followUpSent",
    ];
    const patch: Partial<ProfessorRecord> = {};
    for (const k of allowed) {
      if (k in body) (patch as any)[k] = body[k];
    }
    const updated = updateProfessor(params.id, patch);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ professor: updated });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Update failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const n = deleteProfessors([params.id]);
  return NextResponse.json({ ok: true, deleted: n });
}
