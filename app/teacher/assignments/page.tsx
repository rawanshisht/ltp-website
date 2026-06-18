import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateAssignmentDialog } from "@/components/teacher/create-assignment-dialog";
import { AssignmentFilters } from "@/components/teacher/assignment-filters";
import { formatDate } from "@/lib/utils";
import { fileDownloadUrl } from "@/lib/file-utils";

export const dynamic = "force-dynamic";

const classLabels: Record<string, string> = {
  YOUNGER_BOYS: "Younger Boys",
  OLDER_BOYS: "Older Boys",
  GIRLS: "Girls",
};

export default async function TeacherAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; type?: string; class?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const subjectId = params.subject;
  const type = params.type;
  const classId = params["class"];

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      teacherSubjects: { include: { subject: true } },
    },
  });

  const assignments = await prisma.assignment.findMany({
    where: {
      teacherId: teacher!.id,
      ...(subjectId && { subjectId }),
      ...(type === "HOMEWORK" || type === "ASSESSMENT" ? { type } : {}),
      ...(classId ? { OR: [{ classId }, { classId: null }] } : {}),
    },
    include: { subject: true, class: true, marks: true },
    orderBy: { deadline: "desc" },
  });

  const subjects = teacher!.teacherSubjects.map((ts) => ts.subject);
  const classes = await prisma.class.findMany({ orderBy: { name: "asc" } });

  const homework = assignments.filter((a) => a.type === "HOMEWORK");
  const assessments = assignments.filter((a) => a.type === "ASSESSMENT");

  return (
    <div>
      <Header
        title="Assignments"
        description="Manage homework and assessments"
        actions={<CreateAssignmentDialog subjects={subjects} classes={classes} teacherId={teacher!.id} />}
      />

      <AssignmentFilters subjects={subjects} classes={classes} currentSubjectId={subjectId ?? ""} currentClassId={classId ?? ""} />

      <Card className="mb-6">
        <CardHeader><CardTitle>Homework ({homework.length})</CardTitle></CardHeader>
        <CardContent>
          {homework.length === 0 ? (
            <p className="text-sm text-(--muted-foreground)">No homework assignments{subjectId ? " for this subject" : ""}.</p>
          ) : (
            <AssignmentTable assignments={homework} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessments ({assessments.length})</CardTitle>
          <p className="text-xs text-(--muted-foreground) mt-1">Face-to-face — marks entered here</p>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <p className="text-sm text-(--muted-foreground)">No assessments{subjectId ? " for this subject" : ""}.</p>
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
  class: { name: string } | null;
  marks: { handedStatus: string; marks: number | null }[];
};

function AssignmentTable({ assignments, isAssessment = false }: { assignments: Assignment[]; isAssessment?: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Class</TableHead>
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
              <TableCell className="text-(--muted-foreground) text-sm">
                {a.class ? (classLabels[a.class.name] ?? a.class.name) : "All classes"}
              </TableCell>
              <TableCell>{a.maxMarks}</TableCell>
              <TableCell>
                <Badge variant={isPast ? "destructive" : "warning"}>
                  {formatDate(a.deadline)}
                </Badge>
              </TableCell>
              <TableCell>
                {a.fileUrl ? (
                  <a href={fileDownloadUrl(a.fileUrl)} target="_blank" rel="noopener noreferrer" className="text-sm text-(--primary) hover:underline">View</a>
                ) : "—"}
              </TableCell>
              <TableCell className="text-sm">
                {isAssessment ? (
                  <span className="text-(--muted-foreground)">{marked}/{a.marks.length} marked</span>
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
