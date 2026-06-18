import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { MarksEntry } from "@/components/teacher/marks-entry";

export const dynamic = "force-dynamic";

export default async function TeacherMarksPage({
  searchParams,
}: {
  searchParams: Promise<{ assignment?: string; subject?: string; mode?: string; class?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") redirect("/login");

  const params = await searchParams;
  const assignmentId = params.assignment;
  const subjectId = params.subject;
  const mode = params.mode;
  const classId = params["class"];

  const isAssessmentMode = mode === "assessment";

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      teacherSubjects: { include: { subject: true } },
      teacherClasses: { include: { class: true } },
    },
  });

  const subjects = teacher!.teacherSubjects.map((ts) => ts.subject);
  const classes = teacher!.teacherClasses.map((tc) => tc.class);

  const assignments = subjectId
    ? await prisma.assignment.findMany({
        where: {
          teacherId: teacher!.id,
          subjectId,
          type: isAssessmentMode ? "ASSESSMENT" : "HOMEWORK",
          ...(classId ? { OR: [{ classId }, { classId: null }] } : {}),
        },
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
          isActive: true,
          ...(classId ? { classId } : {}),
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
      <Header
        title="Enter Marks"
        description="Record student marks per assignment"
      />
      <MarksEntry
        subjects={subjects}
        classes={classes}
        assignments={assignments}
        selectedAssignment={selectedAssignment}
        studentsWithMarks={studentsWithMarks}
        teacherId={teacher!.id}
        isAssessmentMode={isAssessmentMode}
      />
    </div>
  );
}
