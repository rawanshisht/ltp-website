import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user.role !== "TEACHER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { classId } = await req.json();

  if (classId) {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }

  await prisma.studentSubject.update({
    where: { id },
    data: { classId: classId ?? null },
  });

  return NextResponse.json({ ok: true });
}
