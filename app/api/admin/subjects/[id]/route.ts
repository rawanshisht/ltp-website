import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, type } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  try {
    await prisma.subject.update({ where: { id }, data: { name: name.trim(), type } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "A subject with that name already exists." }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const [assignments, behaviours, attendances, grades, notices, materials] = await Promise.all([
    prisma.assignment.count({ where: { subjectId: id } }),
    prisma.behaviour.count({ where: { subjectId: id } }),
    prisma.attendance.count({ where: { subjectId: id } }),
    prisma.predictedGrade.count({ where: { subjectId: id } }),
    prisma.notice.count({ where: { subjectId: id } }),
    prisma.classMaterial.count({ where: { subjectId: id } }),
  ]);

  const total = assignments + behaviours + attendances + grades + notices + materials;
  if (total > 0) {
    return NextResponse.json(
      { error: "Cannot delete: this subject has existing records. Remove all assignments, attendance, and other data first." },
      { status: 400 }
    );
  }

  await prisma.subject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
