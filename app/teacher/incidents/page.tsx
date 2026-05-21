import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIncidentDialog } from "@/components/teacher/log-incident-dialog";
import { IncidentsTable } from "@/components/teacher/incidents-table";

export const dynamic = "force-dynamic";

export default async function TeacherIncidentsPage() {
  const session = await auth();

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      teacherSubjects: { include: { subject: true } },
      teacherClasses: { include: { class: { include: { students: true } } } },
    },
  });

  const subjects = teacher!.teacherSubjects.map((ts) => ts.subject);
  const students = teacher!.teacherClasses.flatMap((tc) => tc.class.students);

  const incidents = await prisma.incidentLog.findMany({
    where: { teacherId: teacher!.id },
    include: { student: true, subject: true },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <Header
        title="Incident Log"
        description="Record and review behavioural incidents"
        actions={<LogIncidentDialog students={students} subjects={subjects} teacherId={teacher!.id} />}
      />

      <Card>
        <CardHeader><CardTitle>All Incidents ({incidents.length})</CardTitle></CardHeader>
        <CardContent>
          <IncidentsTable incidents={incidents} students={students} subjects={subjects} />
        </CardContent>
      </Card>
    </div>
  );
}
