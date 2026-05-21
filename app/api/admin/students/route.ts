import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, classId, parentId, newParent, subjectIds } = await req.json();

  let resolvedParentId: string | undefined = parentId || undefined;

  if (newParent) {
    const { firstName, lastName, email, password, phone } = newParent;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "A user with that email already exists." }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { firstName, lastName, email, password: hashed, role: "PARENT", phone: phone || null },
    });
    const parent = await prisma.parent.create({ data: { userId: user.id } });
    resolvedParentId = parent.id;
  }

  const student = await prisma.student.create({
    data: {
      name,
      classId,
      studentSubjects: {
        create: subjectIds.map((id: string) => ({ subjectId: id })),
      },
      ...(resolvedParentId && {
        parentStudents: { create: { parentId: resolvedParentId } },
      }),
    },
  });

  return NextResponse.json({ id: student.id });
}
