import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { storeFile } from "@/lib/file-storage";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "PARENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const studentId = formData.get("studentId") as string;
  const assignmentId = formData.get("assignmentId") as string;
  const file = formData.get("file") as File;

  if (!file || file.size === 0) return NextResponse.json({ error: "File required" }, { status: 400 });

  // Verify parent owns this student
  const parent = await prisma.parent.findUnique({ where: { userId: session!.user.id } });
  const link = parent
    ? await prisma.parentStudent.findUnique({
        where: { parentId_studentId: { parentId: parent.id, studentId } },
      })
    : null;
  if (!link) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let fileUrl: string;
  let fileKey: string;
  try {
    const stored = await storeFile(file, "homework");
    fileUrl = stored.url;
    fileKey = stored.key;
  } catch {
    return NextResponse.json({ error: "File upload failed." }, { status: 500 });
  }

  const submission = await prisma.homeworkSubmission.upsert({
    where: { studentId_assignmentId: { studentId, assignmentId } },
    update: { fileUrl, fileKey, submittedAt: new Date() },
    create: { studentId, assignmentId, fileUrl, fileKey },
  });

  // Update mark status to HANDED
  await prisma.studentMark.updateMany({
    where: { studentId, assignmentId },
    data: { handedStatus: "HANDED" },
  });

  return NextResponse.json({ id: submission.id });
}
