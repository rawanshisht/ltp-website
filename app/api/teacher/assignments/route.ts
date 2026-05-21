import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { storeFile } from "@/lib/file-storage";
import { revalidatePath } from "next/cache";

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
    try {
      const stored = await storeFile(file, "assignments");
      fileUrl = stored.url;
      fileKey = stored.key;
    } catch {
      // File upload failed — create assignment without file
    }
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

  revalidatePath("/teacher/assignments");
  revalidatePath("/teacher/marks");
  revalidatePath("/teacher/deadlines");
  return NextResponse.json({ id: assignment.id });
}
