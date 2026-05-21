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
  const teacherId = formData.get("teacherId") as string;
  const file = formData.get("file") as File;

  if (!file || file.size === 0) return NextResponse.json({ error: "File required" }, { status: 400 });

  const blob = await put(`materials/${Date.now()}-${file.name}`, file, { access: "public" });

  const material = await prisma.classMaterial.create({
    data: { title, subjectId, teacherId, fileUrl: blob.url, fileKey: blob.pathname },
  });

  return NextResponse.json({ id: material.id });
}
