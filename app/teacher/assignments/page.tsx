import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateAssignmentDialog } from "@/components/teacher/create-assignment-dialog";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeacherAssignmentsPage() {
  const session = await auth();

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      teacherSubjects: { include: { subject: true } },
      teacherClasses: {
        include: {
          class: {
            include: {
              students: {
                include: { studentSubjects: { where: { droppedAt: null } } },
              },
            },
          },
        },
      },
    },
  });

  const assignments = await prisma.assignment.findMany({
    where: { teacherId: teacher!.id },
    include: {
      subject: true,
      marks: true,
    },
    orderBy: { deadline: "desc" },
  });

  const subjects = teacher!.teacherSubjects.map((ts) => ts.subject);

  return (
    <div>
      <Header
        title="Assignments"
        description="Manage homework and assessments"
        actions={<CreateAssignmentDialog subjects={subjects} teacherId={teacher!.id} />}
      />

      <Card>
        <CardHeader><CardTitle>All Assignments</CardTitle></CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-[--muted-foreground]">No assignments yet. Create one above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Max Marks</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Submissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => {
                  const handed = a.marks.filter((m) => m.handedStatus === "HANDED").length;
                  const overdue = a.marks.filter((m) => m.handedStatus === "OVERDUE").length;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>{a.subject.name}</TableCell>
                      <TableCell>
                        <Badge variant={a.type === "ASSESSMENT" ? "destructive" : "secondary"}>
                          {a.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{a.maxMarks}</TableCell>
                      <TableCell>
                        <Badge variant={new Date(a.deadline) < new Date() ? "destructive" : "warning"}>
                          {formatDate(a.deadline)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.fileUrl ? (
                          <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[--primary] hover:underline">
                            View
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-green-600">{handed} handed</span>
                        {overdue > 0 && <span className="text-red-500 ml-2">{overdue} overdue</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
