import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  try {
    await prisma.class.update({ where: { id }, data: { name: name.trim() } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "A class with that name already exists." }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const [enrolled, materials] = await Promise.all([
    prisma.studentSubject.count({ where: { classId: id } }),
    prisma.classMaterialClass.count({ where: { classId: id } }),
  ]);

  if (enrolled > 0) {
    return NextResponse.json(
      { error: "Cannot delete: students are currently enrolled in this class." },
      { status: 400 }
    );
  }
  if (materials > 0) {
    return NextResponse.json(
      { error: "Cannot delete: course materials are linked to this class." },
      { status: 400 }
    );
  }

  await prisma.class.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
