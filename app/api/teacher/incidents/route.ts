import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { IncidentSeverity } from "@prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { studentId, subjectId, date, title, description, severity, teacherId } = await req.json() as {
    studentId: string;
    subjectId?: string;
    date: string;
    title: string;
    description: string;
    severity: IncidentSeverity;
    teacherId: string;
  };

  const incident = await prisma.incidentLog.create({
    data: {
      studentId,
      teacherId,
      subjectId: subjectId || null,
      date: new Date(date),
      title,
      description,
      severity,
    },
  });

  return NextResponse.json({ id: incident.id });
}
