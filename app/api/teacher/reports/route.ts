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
  const studentId = formData.get("studentId") as string;
  const teacherId = formData.get("teacherId") as string;
  const notes = (formData.get("notes") as string) || undefined;
  const file = formData.get("file") as File | null;

  if (!title || !studentId || !teacherId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  let fileUrl: string | undefined;
  let fileKey: string | undefined;

  if (file && file.size > 0) {
    try {
      const stored = await storeFile(file, "reports");
      fileUrl = stored.url;
      fileKey = stored.key;
    } catch {
      return NextResponse.json({ error: "File upload failed." }, { status: 500 });
    }
  }

  const report = await prisma.studentReport.create({
    data: { title, studentId, teacherId, notes, fileUrl, fileKey },
  });

  revalidatePath("/teacher/reports");
  return NextResponse.json({ id: report.id });
}
