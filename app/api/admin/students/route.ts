import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, classId, parentId, subjectIds } = await req.json();

  const student = await prisma.student.create({
    data: {
      name,
      classId,
      studentSubjects: {
        create: subjectIds.map((id: string) => ({ subjectId: id })),
      },
      ...(parentId && {
        parentStudents: {
          create: { parentId },
        },
      }),
    },
  });

  return NextResponse.json({ id: student.id });
}
