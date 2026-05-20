import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeadlineStatusUpdater } from "@/components/teacher/deadline-status-updater";
import { formatDate } from "@/lib/utils";

export default async function TeacherDeadlinesPage() {
  const session = await auth();

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      teacherClasses: { include: { class: { include: { students: true } } } },
    },
  });

  const studentIds = teacher!.teacherClasses.flatMap((tc) =>
    tc.class.students.map((s) => s.id)
  );

  const assignments = await prisma.assignment.findMany({
    where: { teacherId: teacher!.id },
    include: {
      subject: true,
      marks: {
        where: { studentId: { in: studentIds } },
        include: { student: true },
      },
    },
    orderBy: { deadline: "asc" },
  });

  return (
    <div>
      <Header title="Deadlines" description="Track submission status per student" />

      <div className="space-y-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{assignment.title}</CardTitle>
                  <p className="text-sm text-[--muted-foreground] mt-1">
                    {assignment.subject.name} · Max {assignment.maxMarks} marks · Due {formatDate(assignment.deadline)}
                  </p>
                </div>
                <Badge variant={new Date(assignment.deadline) < new Date() ? "destructive" : "warning"}>
                  {new Date(assignment.deadline) < new Date() ? "Past due" : "Upcoming"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignment.marks.map((mark) => (
                    <TableRow key={mark.id}>
                      <TableCell className="font-medium">{mark.student.name}</TableCell>
                      <TableCell>
                        <DeadlineStatusUpdater markId={mark.id} currentStatus={mark.handedStatus} />
                      </TableCell>
                      <TableCell>
                        {mark.marks !== null ? `${mark.marks}/${assignment.maxMarks}` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
        {assignments.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-[--muted-foreground] text-sm">
              No assignments created yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
