import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, ClipboardList, Bell } from "lucide-react";
import { formatDate, gradeLabel, attendancePercent } from "@/lib/utils";
import { BehaviourBarChart } from "@/components/charts/behaviour-bar-chart";
import { AttendanceBarChart } from "@/components/charts/enrollment-bar-chart";

export const dynamic = "force-dynamic";

function starAvg(records: { behaviourStars: number; attentiveStars: number; engagementStars: number }[]) {
  if (!records.length) return null;
  const total = records.reduce((s, r) => s + r.behaviourStars + r.attentiveStars + r.engagementStars, 0);
  return (total / (records.length * 3)).toFixed(1);
}

const classLabel = (n: string) =>
  n === "YOUNGER_BOYS" ? "Younger Boys" : n === "OLDER_BOYS" ? "Older Boys" : "Girls";

export default async function TeacherDashboard() {
  const session = await auth();

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      teacherSubjects: { include: { subject: true } },
      teacherClasses: { include: { class: { include: { students: true } } } },
    },
  });

  if (!teacher) {
    return <p className="text-(--muted-foreground)">Teacher profile not set up. Contact admin.</p>;
  }

  const subjects = teacher.teacherSubjects.map((ts) => ts.subject);
  const classes = teacher.teacherClasses.map((tc) => tc.class);
  const studentIds = classes.flatMap((c) => c.students.map((s) => s.id));
  const uniqueStudentCount = new Set(studentIds).size;
  const subjectIds = teacher.teacherSubjects.map((ts) => ts.subjectId);

  const [recentNotices, pendingDeadlines, students] = await Promise.all([
    prisma.notice.findMany({
      where: { teacherId: teacher.id },
      include: { subject: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.studentMark.count({
      where: {
        handedStatus: "PENDING",
        studentId: { in: studentIds },
        assignment: { teacherId: teacher.id, deadline: { lt: new Date() } },
      },
    }),
    prisma.student.findMany({
      where: { id: { in: studentIds }, isActive: true },
      include: {
        class: true,
        studentSubjects: {
          where: { droppedAt: null, subjectId: { in: subjectIds } },
          include: {
            subject: {
              include: {
                assignments: {
                  where: { teacherId: teacher.id },
                  include: { marks: { where: { studentId: { in: studentIds } } } },
                },
                predictedGrades: { where: { studentId: { in: studentIds } } },
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
    }),
  ]);

  return (
    <div>
      <Header title="Dashboard" description={`Welcome back, ${session!.user.name}`} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Subjects" value={subjects.length} icon={BookOpen} color="blue" />
        <StatCard label="Classes" value={classes.length} icon={Users} color="purple" />
        <StatCard label="Students" value={uniqueStudentCount} icon={Users} color="green" />
        <StatCard label="Overdue Submissions" value={pendingDeadlines} icon={ClipboardList} color="red" />
      </div>

      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle>My Subjects</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <Badge key={s.id} variant={s.type === "CORE" ? "default" : "secondary"}>
                {s.name}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>My Classes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {classes.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <span className="text-sm font-medium">{classLabel(c.name)}</span>
                <Badge variant="secondary">{c.students.length} students</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <CardTitle>Recent Notices Posted</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {recentNotices.length === 0 ? (
              <p className="text-sm text-(--muted-foreground)">No notices posted yet.</p>
            ) : (
              <div className="space-y-3">
                {recentNotices.map((n) => (
                  <div key={n.id} className="flex items-start justify-between gap-2 py-2 border-b border-(--border) last:border-0">
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-(--muted-foreground)">{n.subject.name}</p>
                    </div>
                    <span className="text-xs text-(--muted-foreground)">{formatDate(n.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student charts */}
      {students.length > 0 && (() => {
        const attendanceData = students.map((s) => ({
          name: s.name.split(" ")[0],
          pct: attendancePercent(
            s.attendances.filter((a) => a.status === "PRESENT").length,
            s.attendances.length
          ),
        }));
        const behaviourData = students
          .filter((s) => s.behaviours.length > 0)
          .map((s) => {
            const n = s.behaviours.length;
            return {
              name: s.name.split(" ")[0],
              behaviour: parseFloat((s.behaviours.reduce((sum, r) => sum + r.behaviourStars, 0) / n).toFixed(1)),
              attentive: parseFloat((s.behaviours.reduce((sum, r) => sum + r.attentiveStars, 0) / n).toFixed(1)),
              engagement: parseFloat((s.behaviours.reduce((sum, r) => sum + r.engagementStars, 0) / n).toFixed(1)),
            };
          });
        return (
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader><CardTitle>Attendance by Student</CardTitle></CardHeader>
              <CardContent><AttendanceBarChart data={attendanceData} /></CardContent>
            </Card>
            {behaviourData.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Behaviour by Student</CardTitle></CardHeader>
                <CardContent><BehaviourBarChart data={behaviourData} /></CardContent>
              </Card>
            )}
          </div>
        );
      })()}

      {/* Student Progress */}
      <h2 className="text-lg font-semibold text-(--foreground) mb-4">Student Progress</h2>
      <div className="space-y-6">
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
