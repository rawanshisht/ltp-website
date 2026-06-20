import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, isActive, subjectIds, parentId, parentDetails, newParent } = await req.json();

  const existing = await prisma.student.findUnique({
    where: { id },
    include: { studentSubjects: { where: { droppedAt: null } } },
  });
  if (!existing) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const currentSubjectIds = existing.studentSubjects.map((ss) => ss.subjectId);
  const toAdd: string[] = subjectIds.filter((sid: string) => !currentSubjectIds.includes(sid));
  const toDrop: string[] = currentSubjectIds.filter((sid) => !subjectIds.includes(sid));

  await prisma.$transaction([
    prisma.student.update({ where: { id }, data: { name, isActive } }),
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

  // Create a brand-new parent and link them
  if (newParent) {
    const { firstName, lastName, email, password, phone } = newParent;
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return NextResponse.json({ error: "A user with that email already exists." }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { firstName, lastName, email, password: hashed, role: "PARENT", phone: phone || null },
    });
    const parent = await prisma.parent.create({ data: { userId: user.id } });
    await prisma.parentStudent.deleteMany({ where: { studentId: id } });
    await prisma.parentStudent.create({ data: { studentId: id, parentId: parent.id } });
    return NextResponse.json({ ok: true });
  }

  // Reassign or remove existing parent link
  if (parentId !== undefined) {
    await prisma.parentStudent.deleteMany({ where: { studentId: id } });
    if (parentId && parentId !== "none") {
      await prisma.parentStudent.create({ data: { studentId: id, parentId } });
    }
  }

  // Update the linked parent's user details
  if (parentDetails && parentId && parentId !== "none") {
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      select: { userId: true },
    });
    if (parent) {
      try {
        await prisma.user.update({
          where: { id: parent.userId },
          data: {
            firstName: parentDetails.firstName,
            lastName: parentDetails.lastName,
            email: parentDetails.email,
            phone: parentDetails.phone || null,
          },
        });
      } catch {
        return NextResponse.json({ error: "That email is already in use by another account." }, { status: 400 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
