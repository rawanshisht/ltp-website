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
      teacherClasses: { include: { class: { include: { students: true } } } },
    },
  });

  const studentSet = new Map<string, { id: string; name: string }>();
  for (const tc of teacher!.teacherClasses) {
    for (const student of tc.class.students) {
      if (student.isActive) studentSet.set(student.id, { id: student.id, name: student.name });
    }
  }
  const students = Array.from(studentSet.values()).sort((a, b) => a.name.localeCompare(b.name));

  const classes = teacher!.teacherClasses.map((tc) => tc.class);

  const reports = await prisma.studentReport.findMany({
    where: { teacherId: teacher!.id },
    include: { student: { include: { class: true } } },
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
          <ReportsTable reports={reports} classes={classes} />
        </CardContent>
      </Card>
    </div>
  );
}
