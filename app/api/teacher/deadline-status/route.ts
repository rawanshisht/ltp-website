import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { markId, handedStatus } = await req.json();

  await prisma.studentMark.update({
    where: { id: markId },
    data: { handedStatus },
  });

  return NextResponse.json({ ok: true });
}
