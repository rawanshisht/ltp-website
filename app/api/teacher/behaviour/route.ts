import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { subjectId, teacherId, date, records } = await req.json() as {
    subjectId: string;
    teacherId: string;
    date: string;
    records: {
      studentId: string;
      behaviourStars: number;
      attentiveStars: number;
      engagementStars: number;
      note: string | null;
    }[];
  };

  const lessonDate = new Date(date);

  await Promise.all(
    records.map((r) =>
      prisma.behaviour.upsert({
        where: { studentId_subjectId_lessonDate: { studentId: r.studentId, subjectId, lessonDate } },
        update: {
          behaviourStars: r.behaviourStars,
          attentiveStars: r.attentiveStars,
          engagementStars: r.engagementStars,
          note: r.note,
          teacherId,
        },
        create: {
          studentId: r.studentId,
          subjectId,
          teacherId,
          lessonDate,
          behaviourStars: r.behaviourStars,
          attentiveStars: r.attentiveStars,
          engagementStars: r.engagementStars,
          note: r.note,
        },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
