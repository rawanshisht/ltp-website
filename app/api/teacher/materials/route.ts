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
  const teacherId = formData.get("teacherId") as string;
  const file = formData.get("file") as File | null;

  let fileUrl: string | undefined;
  let fileKey: string | undefined;

  if (file && file.size > 0) {
    try {
      const stored = await storeFile(file, "materials");
      fileUrl = stored.url;
      fileKey = stored.key;
    } catch (e) {
      return NextResponse.json({ error: "File upload failed." }, { status: 500 });
    }
  }

  const material = await prisma.classMaterial.create({
    data: { title, subjectId, teacherId, fileUrl, fileKey },
  });

  revalidatePath("/teacher/materials");
  return NextResponse.json({ id: material.id });
}
