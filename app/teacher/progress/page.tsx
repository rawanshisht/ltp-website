import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gradeLabel, attendancePercent } from "@/lib/utils";

function starAvg(records: { behaviourStars: number; attentiveStars: number; engagementStars: number }[]) {
  if (!records.length) return null;
  const total = records.reduce((s, r) => s + r.behaviourStars + r.attentiveStars + r.engagementStars, 0);
  return (total / (records.length * 3)).toFixed(1);
}

export default async function TeacherProgressPage() {
  const session = await auth();

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      teacherSubjects: { include: { subject: true } },
      teacherClasses: { include: { class: { include: { students: true } } } },
    },
  });

  const subjectIds = teacher!.teacherSubjects.map((ts) => ts.subjectId);
  const classStudentIds = teacher!.teacherClasses.flatMap((tc) => tc.class.students.map((s) => s.id));

  const students = await prisma.student.findMany({
    where: { id: { in: classStudentIds }, isActive: true },
    include: {
      class: true,
      studentSubjects: {
        where: { droppedAt: null, subjectId: { in: subjectIds } },
        include: {
          subject: {
            include: {
              assignments: {
                where: { teacherId: teacher!.id },
                include: { marks: { where: { studentId: { in: classStudentIds } } } },
              },
              predictedGrades: { where: { studentId: { in: classStudentIds } } },
            },
          },
        },
      },
      behaviours: {
        where: { subjectId: { in: subjectIds } },
        select: { behaviourStars: true, attentiveStars: true, engagementStars: true },
      },
      attendances: {
        where: { subjectId: { in: subjectIds } },
        select: { status: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const classLabel = (n: string) =>
    n === "YOUNGER_BOYS" ? "Younger Boys" : n === "OLDER_BOYS" ? "Older Boys" : "Girls";

  return (
    <div>
      <Header title="Student Progress" description="Overview of all students across your subjects" />

      <div className="space-y-8">
        {students.map((student) => {
          const present = student.attendances.filter((a) => a.status === "PRESENT").length;
          const totalSessions = student.attendances.length;
          const avgBehaviour = starAvg(student.behaviours);

          return (
            <Card key={student.id}>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle>{student.name}</CardTitle>
                    <p className="text-sm text-(--muted-foreground) mt-0.5">{classLabel(student.class.name)}</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-(--muted-foreground) text-xs">Attendance</p>
                      <p className="font-bold text-lg">{attendancePercent(present, totalSessions)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-(--muted-foreground) text-xs">Avg Behaviour</p>
                      <p className="font-bold text-lg">{avgBehaviour ?? "—"}/5</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {student.studentSubjects.length === 0 ? (
                  <p className="text-sm text-(--muted-foreground)">Not enrolled in any of your subjects.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Assignments</TableHead>
                        <TableHead>Average %</TableHead>
                        <TableHead>Predicted Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.studentSubjects.map((ss) => {
                        const subjectMarks = ss.subject.assignments.flatMap((a) =>
                          a.marks.filter((m) => m.studentId === student.id && m.marks !== null)
                        );
                        const earned = subjectMarks.reduce((s, m) => s + (m.marks ?? 0), 0);
                        const possible = subjectMarks.reduce((s, m) => {
                          const a = ss.subject.assignments.find((a) => a.id === m.assignmentId);
                          return s + (a?.maxMarks ?? 0);
                        }, 0);
                        const avg = possible > 0 ? Math.round((earned / possible) * 100) : null;
                        const pg = ss.subject.predictedGrades.find((g) => g.studentId === student.id);

                        return (
                          <TableRow key={ss.subjectId}>
                            <TableCell className="font-medium">{ss.subject.name}</TableCell>
                            <TableCell className="text-(--muted-foreground)">
                              {ss.subject.assignments.length} total, {subjectMarks.length} marked
                            </TableCell>
                            <TableCell>
                              {avg !== null ? (
                                <Badge variant={avg >= 70 ? "success" : avg >= 50 ? "warning" : "destructive"}>
                                  {avg}%
                                </Badge>
                              ) : "—"}
                            </TableCell>
                            <TableCell>
                              {pg ? <Badge variant="default">{gradeLabel(pg.grade)}</Badge> : "—"}
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
        {students.length === 0 && (
          <Card><CardContent className="p-8 text-center text-(--muted-foreground)">No students in your classes.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
