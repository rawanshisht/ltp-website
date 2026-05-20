import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { BehaviourEntry } from "@/components/teacher/behaviour-entry";

export default async function TeacherBehaviourPage({
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
  const classStudentIds = teacher!.teacherClasses.flatMap((tc) =>
    tc.class.students.map((s) => s.id)
  );

  const lessonDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(lessonDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(lessonDate);
  endOfDay.setHours(23, 59, 59, 999);

  const studentsForSubject =
    subjectId
      ? await prisma.student.findMany({
          where: {
            id: { in: classStudentIds },
            studentSubjects: { some: { subjectId, droppedAt: null } },
          },
          include: {
            behaviours: {
              where: {
                subjectId,
                lessonDate: { gte: startOfDay, lte: endOfDay },
              },
            },
          },
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <div>
      <Header title="Behaviour" description="Mark student behaviour per lesson" />
      <BehaviourEntry
        subjects={subjects}
        studentsWithBehaviour={studentsForSubject}
        teacherId={teacher!.id}
        selectedSubjectId={subjectId ?? ""}
        selectedDate={lessonDate.toISOString().split("T")[0]}
      />
    </div>
  );
}
