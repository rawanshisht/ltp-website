import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { firstName, lastName, email, password, subjectIds, classIds } = await req.json();

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashed,
      role: "TEACHER",
      teacher: {
        create: {
          teacherSubjects: {
            create: subjectIds.map((id: string) => ({ subjectId: id })),
          },
          teacherClasses: {
            create: classIds.map((id: string) => ({ classId: id })),
          },
        },
      },
    },
  });

  return NextResponse.json({ id: user.id });
}
