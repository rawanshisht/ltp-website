import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { assignmentId, marks } = await req.json() as {
    assignmentId: string;
    marks: { studentId: string; marks: number | null; handedStatus: string }[];
  };

  await Promise.all(
    marks.map((m) =>
      prisma.studentMark.upsert({
        where: { studentId_assignmentId: { studentId: m.studentId, assignmentId } },
        update: { marks: m.marks, handedStatus: m.handedStatus as "PENDING" | "HANDED" | "OVERDUE" },
        create: {
          studentId: m.studentId,
          assignmentId,
          marks: m.marks,
          handedStatus: m.handedStatus as "PENDING" | "HANDED" | "OVERDUE",
        },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
