import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { MarksEntry } from "@/components/teacher/marks-entry";

export const dynamic = "force-dynamic";

export default async function TeacherMarksPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string; subject?: string }>;
}) {
  const session = await auth();
  const { assignment: assignmentId, subject: subjectId } = await searchParams;

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

  const assignments = subjectId
    ? await prisma.assignment.findMany({
        where: { teacherId: teacher!.id, subjectId },
        include: { subject: true },
        orderBy: { deadline: "desc" },
      })
    : [];

  const selectedAssignment = assignmentId
    ? await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: { subject: true },
      })
    : null;

  const studentsWithMarks = selectedAssignment
    ? await prisma.student.findMany({
        where: {
          id: { in: classStudentIds },
          studentSubjects: {
            some: { subjectId: selectedAssignment.subjectId, droppedAt: null },
          },
        },
        include: {
          marks: { where: { assignmentId: selectedAssignment.id } },
        },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div>
      <Header title="Enter Marks" description="Record student marks per assignment" />
      <MarksEntry
        subjects={subjects}
        assignments={assignments}
        selectedAssignment={selectedAssignment}
        studentsWithMarks={studentsWithMarks}
        teacherId={teacher!.id}
      />
    </div>
  );
}
