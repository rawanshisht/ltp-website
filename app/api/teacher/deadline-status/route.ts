import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { markId, handedStatus } = await req.json();

  await prisma.studentMark.update({
    where: { id: markId },
    data: { handedStatus },
  });

  revalidatePath("/teacher/deadlines");
  return NextResponse.json({ ok: true });
}
