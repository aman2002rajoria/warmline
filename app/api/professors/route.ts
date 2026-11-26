import { NextRequest, NextResponse } from "next/server";
import {
  deleteProfessors,
  listProfessors,
  upsertProfessor,
} from "@/lib/professors-store";
import { isValidEmail } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ professors: listProfessors() });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!data.professorName || !data.university || !data.email) {
      return NextResponse.json(
        { error: "Name, company and email are required" },
        { status: 400 },
      );
    }
    if (!isValidEmail(data.email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const { record, created } = upsertProfessor({
      professorName: data.professorName,
      university: data.university,
      email: data.email,
      department: data.department,
      labWebsite: data.labWebsite,
      researchArea: data.researchArea,
      notes: data.notes,
    });
    if (!created) {
      return NextResponse.json(
        { error: "Someone with that email is already in your list" },
        { status: 409 },
      );
    }
    return NextResponse.json({ professor: record }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || "Create failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids");
  if (!ids) {
    return NextResponse.json({ error: "ids query required" }, { status: 400 });
  }
  const idArr = ids.split(",").filter(Boolean);
  const deleted = deleteProfessors(idArr);
  return NextResponse.json({ ok: true, deleted });
}
