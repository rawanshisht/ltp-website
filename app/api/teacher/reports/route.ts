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

  let report;
  try {
    report = await prisma.studentReport.create({
      data: { title, studentId, teacherId, notes, fileUrl, fileKey },
    });
  } catch {
    return NextResponse.json({ error: "Failed to save report." }, { status: 500 });
  }

  revalidatePath("/teacher/reports");
  return NextResponse.json({ id: report.id });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, title, notes } = await req.json() as { id: string; title: string; notes?: string };

  try {
    await prisma.studentReport.update({
      where: { id },
      data: { title, notes: notes || null },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update report." }, { status: 500 });
  }

  revalidatePath("/teacher/reports");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json() as { id: string };

  try {
    await prisma.studentReport.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to delete report." }, { status: 500 });
  }

  revalidatePath("/teacher/reports");
  return NextResponse.json({ ok: true });
}
