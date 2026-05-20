import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, body, subjectId, teacherId } = await req.json();

  const notice = await prisma.notice.create({
    data: { title, body, subjectId, teacherId },
  });

  return NextResponse.json({ id: notice.id });
}
