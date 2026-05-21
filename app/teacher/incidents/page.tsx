import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogIncidentDialog } from "@/components/teacher/log-incident-dialog";
import { formatDate } from "@/lib/utils";

function severityVariant(s: string) {
  if (s === "MAJOR") return "destructive";
  if (s === "MODERATE") return "warning";
  return "secondary";
}

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
        <CardHeader><CardTitle>All Incidents</CardTitle></CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-sm text-[--muted-foreground]">No incidents logged.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell className="text-[--muted-foreground] whitespace-nowrap">{formatDate(inc.date)}</TableCell>
                    <TableCell className="font-medium">{inc.student.name}</TableCell>
                    <TableCell>{inc.title}</TableCell>
                    <TableCell>{inc.subject?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(inc.severity)}>
                        {inc.severity.charAt(0) + inc.severity.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[--muted-foreground] text-sm max-w-xs truncate">
                      {inc.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
