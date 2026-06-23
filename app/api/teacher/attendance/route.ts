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
    records: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE"; minutesLate?: number }[];
  };

  const sessionDate = new Date(date);

  await Promise.all(
    records.map((r) =>
      prisma.attendance.upsert({
        where: { studentId_subjectId_sessionDate: { studentId: r.studentId, subjectId, sessionDate } },
        update: { status: r.status, teacherId, minutesLate: r.status === "LATE" ? (r.minutesLate ?? null) : null },
        create: { studentId: r.studentId, subjectId, teacherId, sessionDate, status: r.status, minutesLate: r.status === "LATE" ? (r.minutesLate ?? null) : null },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
