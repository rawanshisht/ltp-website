import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { gradeLabel, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ParentSubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await auth();
  const { child: childId } = await searchParams;

  const parent = await prisma.parent.findUnique({
    where: { userId: session!.user.id },
    include: { parentStudents: { include: { student: true } } },
  });

  const children = parent!.parentStudents.map((ps) => ps.student);
  const selected = children.find((c) => c.id === childId) ?? children[0];

  const enrollments = await prisma.studentSubject.findMany({
    where: { studentId: selected.id, droppedAt: null },
    include: {
      subject: {
        include: {
          assignments: {
            include: { marks: { where: { studentId: selected.id } } },
          },
          predictedGrades: { where: { studentId: selected.id } },
        },
      },
    },
  });

  return (
    <div>
      <Header
        title="Subjects & Marks"
        description={`Academic performance for ${selected.name}`}
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      <div className="space-y-6">
        {enrollments.map((en) => {
          const subject = en.subject;
          const marks = subject.assignments.flatMap((a) =>
            a.marks.map((m) => ({ ...m, assignment: a }))
          );
          const marksWithValues = marks.filter((m) => m.marks !== null);
          const totalEarned = marksWithValues.reduce((s, m) => s + (m.marks ?? 0), 0);
          const totalPossible = marksWithValues.reduce((s, m) => s + m.assignment.maxMarks, 0);
          const average = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : null;
          const predictedGrade = subject.predictedGrades[0];

          return (
            <Card key={en.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle>{subject.name}</CardTitle>
                    <Badge variant={subject.type === "CORE" ? "default" : "secondary"}>
                      {subject.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    {average !== null && (
                      <div className="text-right">
                        <p className="text-xs text-[--muted-foreground]">Average</p>
                        <p className="text-lg font-bold text-[--foreground]">{average}%</p>
                      </div>
                    )}
                    {predictedGrade && (
                      <div className="text-right">
                        <p className="text-xs text-[--muted-foreground]">Predicted GCSE</p>
                        <Badge variant="default" className="text-sm px-3 py-1">
                          {gradeLabel(predictedGrade.grade)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {subject.assignments.length === 0 ? (
                  <p className="text-sm text-[--muted-foreground]">No assignments yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subject.assignments.map((assignment) => {
                        const mark = assignment.marks[0];
                        const isAssessment = assignment.type === "ASSESSMENT";
                        return (
                          <TableRow key={assignment.id}>
                            <TableCell className="font-medium">{assignment.title}</TableCell>
                            <TableCell>
                              <Badge variant={isAssessment ? "secondary" : "outline"}>
                                {isAssessment ? "Assessment" : "Homework"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[--muted-foreground]">
                              {formatDate(assignment.deadline)}
                            </TableCell>
                            <TableCell>
                              {mark?.marks !== null && mark?.marks !== undefined
                                ? `${mark.marks}/${assignment.maxMarks}`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {isAssessment ? (
                                <span className="text-[--muted-foreground] text-sm">—</span>
                              ) : mark ? (
                                <Badge variant={
                                  mark.handedStatus === "HANDED" ? "success"
                                  : mark.handedStatus === "OVERDUE" ? "destructive"
                                  : "secondary"
                                }>
                                  {mark.handedStatus}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">PENDING</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
