import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
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

  revalidatePath("/teacher/incidents");
  return NextResponse.json({ id: incident.id });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, studentId, subjectId, date, title, description, severity } = await req.json() as {
    id: string;
    studentId: string;
    subjectId?: string;
    date: string;
    title: string;
    description: string;
    severity: IncidentSeverity;
  };

  const incident = await prisma.incidentLog.update({
    where: { id },
    data: {
      studentId,
      subjectId: subjectId || null,
      date: new Date(date),
      title,
      description,
      severity,
    },
  });

  revalidatePath("/teacher/incidents");
  return NextResponse.json({ id: incident.id });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (session?.user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json() as { id: string };

  await prisma.incidentLog.delete({ where: { id } });

  revalidatePath("/teacher/incidents");
  return NextResponse.json({ ok: true });
}
