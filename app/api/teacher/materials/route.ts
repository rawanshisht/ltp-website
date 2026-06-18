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
  const classIds = (formData.getAll("classIds") as string[]).filter(Boolean);
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

  let material;
  try {
    material = await prisma.classMaterial.create({
      data: {
        title, subjectId, teacherId, fileUrl, fileKey,
        classes: classIds.length > 0
          ? { create: classIds.map((classId) => ({ classId })) }
          : undefined,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to save material." }, { status: 500 });
  }

  revalidatePath("/teacher/materials");
  return NextResponse.json({ id: material.id });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, title, subjectId, classIds } = await req.json() as {
    id: string; title: string; subjectId: string; classIds: string[];
  };

  try {
    await prisma.classMaterial.update({
      where: { id },
      data: {
        title, subjectId,
        classes: {
          deleteMany: {},
          create: classIds.map((classId) => ({ classId })),
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update material." }, { status: 500 });
  }

  revalidatePath("/teacher/materials");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json() as { id: string };

  try {
    await prisma.classMaterial.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to delete material." }, { status: 500 });
  }

  revalidatePath("/teacher/materials");
  return NextResponse.json({ ok: true });
}
