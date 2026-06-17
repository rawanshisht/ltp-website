import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { assignmentId, marks, isAssessment } = await req.json() as {
    assignmentId: string;
    isAssessment?: boolean;
    marks: { studentId: string; marks: number | null }[];
  };

  // For assessments: always HANDED if mark entered (face-to-face, no handed/overdue concept)
  // For homework: if mark entered → HANDED; if null → keep PENDING (overdue computed by deadline)
  await Promise.all(
    marks.map((m) =>
      prisma.studentMark.upsert({
        where: { studentId_assignmentId: { studentId: m.studentId, assignmentId } },
        update: {
          marks: m.marks,
          ...(isAssessment
            ? { handedStatus: m.marks !== null ? "HANDED" : "PENDING" }
            : { handedStatus: m.marks !== null ? "HANDED" : "PENDING" }),
        },
        create: {
          studentId: m.studentId,
          assignmentId,
          marks: m.marks,
          handedStatus: m.marks !== null ? "HANDED" : "PENDING",
        },
      })
    )
  );

  revalidatePath("/teacher/marks");
  revalidatePath("/teacher/deadlines");
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { studentId, assignmentId, marks } = await req.json() as {
    studentId: string;
    assignmentId: string;
    marks: number | null;
  };

  await prisma.studentMark.upsert({
    where: { studentId_assignmentId: { studentId, assignmentId } },
    update: { marks, handedStatus: marks !== null ? "HANDED" : "PENDING" },
    create: { studentId, assignmentId, marks, handedStatus: marks !== null ? "HANDED" : "PENDING" },
  });

  revalidatePath("/teacher/marks");
  revalidatePath("/teacher/deadlines");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { studentId, assignmentId } = await req.json() as { studentId: string; assignmentId: string };

  await prisma.studentMark.updateMany({
    where: { studentId, assignmentId },
    data: { marks: null, handedStatus: "PENDING" },
  });

  revalidatePath("/teacher/marks");
  revalidatePath("/teacher/deadlines");
  return NextResponse.json({ ok: true });
}
