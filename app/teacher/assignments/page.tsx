import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateAssignmentDialog } from "@/components/teacher/create-assignment-dialog";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeacherAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; type?: string }>;
}) {
  const session = await auth();
  const { subject: subjectId, type } = await searchParams;

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
    where: {
      teacherId: teacher!.id,
      ...(subjectId && { subjectId }),
      ...(type === "HOMEWORK" || type === "ASSESSMENT" ? { type } : {}),
    },
    include: { subject: true, marks: true },
    orderBy: { deadline: "desc" },
  });

  const subjects = teacher!.teacherSubjects.map((ts) => ts.subject);

  const homework = assignments.filter((a) => a.type === "HOMEWORK");
  const assessments = assignments.filter((a) => a.type === "ASSESSMENT");

  return (
    <div>
      <Header
        title="Assignments"
        description="Manage homework and assessments"
        actions={<CreateAssignmentDialog subjects={subjects} teacherId={teacher!.id} />}
      />

      {/* Subject filter */}
      <form className="flex flex-wrap gap-3 mb-6">
        <select name="subject" defaultValue={subjectId ?? ""} className="h-9 rounded-md border border-[--border] bg-white px-3 text-sm">
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="submit" className="h-9 px-4 rounded-md bg-[--primary] text-white text-sm font-medium">Filter</button>
        <a href="/teacher/assignments" className="h-9 px-4 rounded-md border border-[--border] text-sm flex items-center hover:bg-slate-50">Clear</a>
      </form>

      {/* Homework */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Homework ({homework.length})</CardTitle></CardHeader>
        <CardContent>
          {homework.length === 0 ? (
            <p className="text-sm text-[--muted-foreground]">No homework assignments{subjectId ? " for this subject" : ""}.</p>
          ) : (
            <AssignmentTable assignments={homework} />
          )}
        </CardContent>
      </Card>

      {/* Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Assessments ({assessments.length})</CardTitle>
          <p className="text-xs text-[--muted-foreground] mt-1">Face-to-face — marks entered here</p>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <p className="text-sm text-[--muted-foreground]">No assessments{subjectId ? " for this subject" : ""}.</p>
          ) : (
            <AssignmentTable assignments={assessments} isAssessment />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type Assignment = {
  id: string;
  title: string;
  maxMarks: number;
  deadline: Date;
  fileUrl: string | null;
  subject: { name: string };
  marks: { handedStatus: string; marks: number | null }[];
};

function AssignmentTable({ assignments, isAssessment = false }: { assignments: Assignment[]; isAssessment?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Max Marks</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead>File</TableHead>
          {isAssessment ? (
            <TableHead>Marked</TableHead>
          ) : (
            <TableHead>Submissions</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((a) => {
          const handed = a.marks.filter((m) => m.handedStatus === "HANDED").length;
          const overdue = a.marks.filter((m) => m.handedStatus === "OVERDUE").length;
          const marked = a.marks.filter((m) => m.marks !== null).length;
          const isPast = new Date(a.deadline) < new Date();
          return (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.title}</TableCell>
              <TableCell>{a.subject.name}</TableCell>
              <TableCell>{a.maxMarks}</TableCell>
              <TableCell>
                <Badge variant={isPast ? "destructive" : "warning"}>
                  {formatDate(a.deadline)}
                </Badge>
              </TableCell>
              <TableCell>
                {a.fileUrl ? (
                  <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[--primary] hover:underline">View</a>
                ) : "—"}
              </TableCell>
              <TableCell className="text-sm">
                {isAssessment ? (
                  <span className="text-[--muted-foreground]">{marked}/{a.marks.length} marked</span>
                ) : (
                  <>
                    <span className="text-green-600">{handed} handed</span>
                    {overdue > 0 && <span className="text-red-500 ml-2">{overdue} overdue</span>}
                  </>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
