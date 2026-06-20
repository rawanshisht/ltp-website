import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadReportDialog } from "@/components/teacher/upload-report-dialog";
import { ReportsTable } from "@/components/teacher/reports-table";

export const dynamic = "force-dynamic";

export default async function TeacherReportsPage() {
  const session = await auth();

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      teacherSubjects: { include: { subject: true } },
      teacherClasses: { include: { class: true } },
    },
  });

  const subjectIds = teacher!.teacherSubjects.map((ts) => ts.subjectId);
  const teacherClassIds = teacher!.teacherClasses.map((tc) => tc.classId);

  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      studentSubjects: {
        some: { subjectId: { in: subjectIds }, classId: { in: teacherClassIds }, droppedAt: null },
      },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const reports = await prisma.studentReport.findMany({
    where: { teacherId: teacher!.id },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Header
        title="Student Reports"
        description="Upload and manage reports for individual students"
        actions={<UploadReportDialog students={students} teacherId={teacher!.id} />}
      />

      <Card>
        <CardHeader><CardTitle>Uploaded Reports</CardTitle></CardHeader>
        <CardContent>
          <ReportsTable reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
