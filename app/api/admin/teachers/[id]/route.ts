import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { firstName, lastName, email, subjectIds, classIds } = await req.json();

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: teacher.userId },
      data: { firstName, lastName, email },
    }),
    prisma.teacherSubject.deleteMany({ where: { teacherId: id } }),
    prisma.teacherClass.deleteMany({ where: { teacherId: id } }),
  ]);

  await prisma.teacherSubject.createMany({
    data: subjectIds.map((subjectId: string) => ({ teacherId: id, subjectId })),
  });
  await prisma.teacherClass.createMany({
    data: classIds.map((classId: string) => ({ teacherId: id, classId })),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Deleting the user cascades to the teacher record
  await prisma.user.delete({ where: { id: teacher.userId } });

  return NextResponse.json({ ok: true });
}
