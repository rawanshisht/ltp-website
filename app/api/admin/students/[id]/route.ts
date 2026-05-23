import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, classId, isActive, subjectIds, parentId } = await req.json();

  const existing = await prisma.student.findUnique({
    where: { id },
    include: { studentSubjects: { where: { droppedAt: null } } },
  });
  if (!existing) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const currentSubjectIds = existing.studentSubjects.map((ss) => ss.subjectId);
  const toAdd: string[] = subjectIds.filter((sid: string) => !currentSubjectIds.includes(sid));
  const toDrop: string[] = currentSubjectIds.filter((sid) => !subjectIds.includes(sid));

  await prisma.$transaction([
    prisma.student.update({ where: { id }, data: { name, classId, isActive } }),
    ...toAdd.map((subjectId) =>
      prisma.studentSubject.upsert({
        where: { studentId_subjectId: { studentId: id, subjectId } },
        update: { droppedAt: null },
        create: { studentId: id, subjectId },
      })
    ),
    ...(toDrop.length > 0
      ? [
          prisma.studentSubject.updateMany({
            where: { studentId: id, subjectId: { in: toDrop } },
            data: { droppedAt: new Date() },
          }),
        ]
      : []),
  ]);

  // Handle parent assignment separately (delete + recreate)
  if (parentId !== undefined) {
    await prisma.parentStudent.deleteMany({ where: { studentId: id } });
    if (parentId && parentId !== "none") {
      await prisma.parentStudent.create({ data: { studentId: id, parentId } });
    }
  }

  return NextResponse.json({ ok: true });
}
