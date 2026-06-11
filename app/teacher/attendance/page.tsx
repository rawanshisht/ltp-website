import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { AttendanceEntry } from "@/components/teacher/attendance-entry";

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; date?: string; view?: string; month?: string }>;
}) {
  const session = await auth();
  const { subject: subjectId, date, view, month } = await searchParams;

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      teacherSubjects: { include: { subject: true } },
      teacherClasses: {
        include: { class: { include: { students: true } } },
      },
    },
  });

  const subjects = teacher!.teacherSubjects.map((ts) => ts.subject);

  const sessionDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(sessionDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(sessionDate);
  endOfDay.setHours(23, 59, 59, 999);

  const studentsForSubject =
    subjectId && view !== "monthly"
      ? await prisma.student.findMany({
          where: {
            isActive: true,
            studentSubjects: { some: { subjectId, droppedAt: null } },
          },
          include: {
            class: true,
            attendances: {
              where: {
                subjectId,
                sessionDate: { gte: startOfDay, lte: endOfDay },
              },
            },
          },
          orderBy: { name: "asc" },
        })
      : [];

  const monthStr = month ?? new Date().toISOString().slice(0, 7);
  const [yearNum, monthNum] = monthStr.split("-").map(Number);
  const startOfMonth = new Date(yearNum, monthNum - 1, 1);
  const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

  const monthlyRecords =
    subjectId && view === "monthly"
      ? (
          await prisma.attendance.findMany({
            where: {
              subjectId,
              sessionDate: { gte: startOfMonth, lte: endOfMonth },
            },
            include: { student: { select: { id: true, name: true, class: { select: { name: true } } } } },
            orderBy: [{ student: { name: "asc" } }, { sessionDate: "asc" }],
          })
        ).map((r) => ({
          studentId: r.studentId,
          studentName: r.student.name,
          className: r.student.class.name as string,
          date: r.sessionDate.toISOString().split("T")[0],
          status: r.status as "PRESENT" | "ABSENT" | "LATE",
        }))
      : [];

  return (
    <div>
      <Header title="Attendance" description="Mark attendance per class session" />
      <AttendanceEntry
        subjects={subjects}
        studentsWithAttendance={studentsForSubject}
        teacherId={teacher!.id}
        selectedSubjectId={subjectId ?? ""}
        selectedDate={sessionDate.toISOString().split("T")[0]}
        selectedView={view ?? "mark"}
        selectedMonth={monthStr}
        monthlyRecords={monthlyRecords}
      />
    </div>
  );
}
