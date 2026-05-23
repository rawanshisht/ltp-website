import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { AttendanceEntry } from "@/components/teacher/attendance-entry";

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; date?: string }>;
}) {
  const session = await auth();
  const { subject: subjectId, date } = await searchParams;

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
    subjectId
      ? await prisma.student.findMany({
          where: {
            isActive: true,
            studentSubjects: { some: { subjectId, droppedAt: null } },
          },
          include: {
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

  return (
    <div>
      <Header title="Attendance" description="Mark attendance per class session" />
      <AttendanceEntry
        subjects={subjects}
        studentsWithAttendance={studentsForSubject}
        teacherId={teacher!.id}
        selectedSubjectId={subjectId ?? ""}
        selectedDate={sessionDate.toISOString().split("T")[0]}
      />
    </div>
  );
}
