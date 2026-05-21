import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { gradeLabel, attendancePercent, formatDate } from "@/lib/utils";

function starAvg(records: { behaviourStars: number; attentiveStars: number; engagementStars: number }[]) {
  if (!records.length) return null;
  const total = records.reduce((s, r) => s + r.behaviourStars + r.attentiveStars + r.engagementStars, 0);
  return (total / (records.length * 3)).toFixed(1);
}

export default async function ParentProgressPage({
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

  const [enrollments, behaviours, attendances, predictedGrades] = await Promise.all([
    prisma.studentSubject.findMany({
      where: { studentId: selected.id, droppedAt: null },
      include: {
        subject: {
          include: {
            assignments: {
              include: {
                marks: { where: { studentId: selected.id } },
              },
              orderBy: { deadline: "desc" },
            },
          },
        },
      },
    }),
    prisma.behaviour.findMany({
      where: { studentId: selected.id },
      select: { behaviourStars: true, attentiveStars: true, engagementStars: true, subjectId: true, lessonDate: true },
      orderBy: { lessonDate: "desc" },
    }),
    prisma.attendance.findMany({
      where: { studentId: selected.id },
      select: { status: true, subjectId: true },
    }),
    prisma.predictedGrade.findMany({
      where: { studentId: selected.id },
      include: { subject: true },
    }),
  ]);

  const present = attendances.filter((a) => a.status === "PRESENT").length;
  const overallAvgBehaviour = starAvg(behaviours);

  return (
    <div>
      <Header
        title="Progress Overview"
        description={`Full academic progress for ${selected.name}`}
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-xs text-blue-600 mb-1">Subjects</p>
          <p className="text-2xl font-bold text-blue-700">{enrollments.length}</p>
        </div>
        <div className="rounded-xl bg-green-50 p-4">
          <p className="text-xs text-green-600 mb-1">Attendance</p>
          <p className="text-2xl font-bold text-green-700">{attendancePercent(present, attendances.length)}%</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-xs text-amber-600 mb-1">Avg Behaviour</p>
          <p className="text-2xl font-bold text-amber-700">{overallAvgBehaviour ?? "—"}/5</p>
        </div>
        <div className="rounded-xl bg-purple-50 p-4">
          <p className="text-xs text-purple-600 mb-1">Predicted Grades</p>
          <p className="text-2xl font-bold text-purple-700">{predictedGrades.length}</p>
        </div>
      </div>

      {/* Per-subject breakdown */}
      <div className="space-y-6">
        {enrollments.map((en) => {
          const subject = en.subject;
          const subjectBehaviours = behaviours.filter((b) => b.subjectId === en.subjectId);
          const subjectAttendances = attendances.filter((a) => a.subjectId === en.subjectId);
          const subjectPresent = subjectAttendances.filter((a) => a.status === "PRESENT").length;
          const avgBeh = starAvg(subjectBehaviours);

          const marksWithValues = subject.assignments.flatMap((a) =>
            a.marks.filter((m) => m.marks !== null).map((m) => ({ ...m, assignment: a }))
          );
          const earned = marksWithValues.reduce((s, m) => s + (m.marks ?? 0), 0);
          const possible = marksWithValues.reduce((s, m) => s + m.assignment.maxMarks, 0);
          const avg = possible > 0 ? Math.round((earned / possible) * 100) : null;
          const predictedGrade = predictedGrades.find((pg) => pg.subjectId === en.subjectId);

          return (
            <Card key={en.id}>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <CardTitle>{subject.name}</CardTitle>
                    <Badge variant={subject.type === "CORE" ? "default" : "secondary"}>{subject.type}</Badge>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {avg !== null && (
                      <div className="text-center">
                        <p className="text-xs text-[--muted-foreground]">Average</p>
                        <Badge variant={avg >= 70 ? "success" : avg >= 50 ? "warning" : "destructive"}>
                          {avg}%
                        </Badge>
                      </div>
                    )}
                    {predictedGrade && (
                      <div className="text-center">
                        <p className="text-xs text-[--muted-foreground]">GCSE Predicted</p>
                        <Badge variant="default">{gradeLabel(predictedGrade.grade)}</Badge>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-xs text-[--muted-foreground]">Attendance</p>
                      <p className="font-bold">{attendancePercent(subjectPresent, subjectAttendances.length)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[--muted-foreground]">Behaviour</p>
                      <p className="font-bold">{avgBeh ?? "—"}/5</p>
                    </div>
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
                      {subject.assignments.map((a) => {
                        const mark = a.marks[0];
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.title}</TableCell>
                            <TableCell>
                              <Badge variant={a.type === "ASSESSMENT" ? "destructive" : "secondary"}>{a.type}</Badge>
                            </TableCell>
                            <TableCell className="text-[--muted-foreground]">{formatDate(a.deadline)}</TableCell>
                            <TableCell>
                              {mark?.marks !== null && mark?.marks !== undefined
                                ? `${mark.marks}/${a.maxMarks}`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {mark ? (
                                <Badge variant={mark.handedStatus === "HANDED" ? "success" : mark.handedStatus === "OVERDUE" ? "destructive" : "secondary"}>
                                  {mark.handedStatus}
                                </Badge>
                              ) : <Badge variant="secondary">PENDING</Badge>}
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
