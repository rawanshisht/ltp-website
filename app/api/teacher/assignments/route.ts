import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const subjectId = formData.get("subjectId") as string;
  const type = formData.get("type") as "HOMEWORK" | "ASSESSMENT";
  const maxMarks = parseInt(formData.get("maxMarks") as string);
  const deadline = new Date(formData.get("deadline") as string);
  const teacherId = formData.get("teacherId") as string;
  const file = formData.get("file") as File | null;

  let fileUrl: string | undefined;
  let fileKey: string | undefined;

  if (file && file.size > 0) {
    const blob = await put(`assignments/${Date.now()}-${file.name}`, file, {
      access: "public",
    });
    fileUrl = blob.url;
    fileKey = blob.pathname;
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: session!.user.id } });

  const classStudentIds = (
    await prisma.student.findMany({
      where: {
        class: { teacherClasses: { some: { teacherId: teacher!.id } } },
        studentSubjects: { some: { subjectId, droppedAt: null } },
      },
      select: { id: true },
    })
  ).map((s) => s.id);

  const assignment = await prisma.assignment.create({
    data: {
      title,
      subjectId,
      type,
      maxMarks,
      deadline,
      teacherId,
      fileUrl,
      fileKey,
      marks: {
        create: classStudentIds.map((studentId) => ({ studentId })),
      },
    },
  });

  return NextResponse.json({ id: assignment.id });
}
