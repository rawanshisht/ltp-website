import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Activity, CalendarCheck, ClipboardList } from "lucide-react";
import { formatDate, gradeLabel, attendancePercent } from "@/lib/utils";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { MarksBarChart } from "@/components/charts/marks-bar-chart";
import { AttendanceDonut } from "@/components/charts/attendance-donut";

export const dynamic = "force-dynamic";

function starAvg(records: { behaviourStars: number; attentiveStars: number; engagementStars: number }[]) {
  if (!records.length) return null;
  const total = records.reduce((s, r) => s + r.behaviourStars + r.attentiveStars + r.engagementStars, 0);
  return (total / (records.length * 3)).toFixed(1);
}

export default async function ParentDashboard({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await auth();
  const { child: childId } = await searchParams;

  const parent = await prisma.parent.findUnique({
    where: { userId: session!.user.id },
    include: {
      parentStudents: { include: { student: { include: { class: true } } } },
    },
  });

  if (!parent || parent.parentStudents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-(--muted-foreground)">No children linked to your account. Contact admin.</p>
      </div>
    );
  }

  const children = parent.parentStudents.map((ps) => ps.student);
  const selected = children.find((c) => c.id === childId) ?? children[0];

  const [enrollments, behaviours, attendances, upcomingDeadlines, predictedGrades] = await Promise.all([
    prisma.studentSubject.findMany({
      where: { studentId: selected.id, droppedAt: null },
      include: {
        subject: {
          include: {
            assignments: {
              include: { marks: { where: { studentId: selected.id } } },
              orderBy: { deadline: "desc" },
            },
          },
        },
      },
    }),
    prisma.behaviour.findMany({
      where: { studentId: selected.id },
      select: { behaviourStars: true, attentiveStars: true, engagementStars: true, subjectId: true },
    }),
    prisma.attendance.findMany({
      where: { studentId: selected.id },
      select: { status: true, subjectId: true },
    }),
    prisma.studentMark.findMany({
      where: {
        studentId: selected.id,
        handedStatus: "PENDING",
        assignment: { deadline: { gte: new Date() }, type: "HOMEWORK" },
      },
      include: { assignment: { include: { subject: true } } },
      orderBy: { assignment: { deadline: "asc" } },
      take: 5,
    }),
    prisma.predictedGrade.findMany({
      where: { studentId: selected.id },
      include: { subject: true },
    }),
  ]);

  const totalSessions = attendances.length;
  const presentCount = attendances.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendances.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendances.filter((a) => a.status === "LATE").length;
  const avgBehaviour = starAvg(behaviours);

  const marksChartData = enrollments.flatMap((en) => {
    const marksWithValues = en.subject.assignments.flatMap((a) =>
      a.marks.filter((m) => m.marks !== null).map((m) => ({ marks: m.marks!, maxMarks: a.maxMarks }))
    );
    const earned = marksWithValues.reduce((s, m) => s + m.marks, 0);
    const possible = marksWithValues.reduce((s, m) => s + m.maxMarks, 0);
    if (possible === 0) return [];
    return [{ subject: en.subject.name, avg: Math.round((earned / possible) * 100) }];
  });

  const className =
    selected.class.name === "YOUNGER_BOYS" ? "Younger Boys"
    : selected.class.name === "OLDER_BOYS" ? "Older Boys"
    : "Girls";

  return (
    <div>
      <Header
        title="Dashboard"
        description="Overview of your child's progress"
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      {/* Child info banner */}
      <div className="mb-6 rounded-xl bg-[#00dcde] p-6">
        <p className="text-[#0f172a]/70 text-sm mb-1">Currently viewing</p>
        <h2 className="text-xl font-bold text-[#0f172a]">{selected.name}</h2>
        <p className="text-[#0f172a]/60 text-sm mt-1">{className} Class · {enrollments.length} subjects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Subjects" value={enrollments.length} icon={BookOpen} color="blue" />
        <StatCard label="Avg Behaviour" value={`${avgBehaviour ?? "—"}/5`} icon={Activity} color="green" />
        <StatCard
          label="Attendance"
          value={`${attendancePercent(presentCount, totalSessions)}%`}
          icon={CalendarCheck}
          color="amber"
          trend={`${presentCount}/${totalSessions} sessions`}
        />
        <StatCard label="Pending Homework" value={upcomingDeadlines.length} icon={ClipboardList} color="red" />
      </div>

      {/* Charts */}
      {(marksChartData.length > 0 || totalSessions > 0) && (
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {marksChartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Average Marks by Subject</CardTitle></CardHeader>
              <CardContent>
                <MarksBarChart data={marksChartData} />
              </CardContent>
            </Card>
          )}
          {totalSessions > 0 && (
            <Card>
              <CardHeader><CardTitle>Attendance Breakdown</CardTitle></CardHeader>
              <CardContent>
                <AttendanceDonut present={presentCount} absent={absentCount} late={lateCount} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Predicted grades + upcoming deadlines */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader><CardTitle>Predicted GCSE Grades</CardTitle></CardHeader>
          <CardContent>
            {predictedGrades.length === 0 ? (
              <p className="text-sm text-(--muted-foreground)">No predicted grades yet.</p>
            ) : (
              <div className="space-y-2">
                {predictedGrades.map((pg) => (
                  <div key={pg.id} className="flex items-center justify-between">
                    <span className="text-sm">{pg.subject.name}</span>
                    <Badge variant="default">{gradeLabel(pg.grade)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Upcoming Homework Deadlines</CardTitle></CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-(--muted-foreground)">No upcoming deadlines.</p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{m.assignment.title}</p>
                      <p className="text-xs text-(--muted-foreground)">{m.assignment.subject.name}</p>
                    </div>
                    <Badge variant="warning">{formatDate(m.assignment.deadline)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-subject progress */}
      <h2 className="text-lg font-semibold text-(--foreground) mb-4">Subject Progress</h2>
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
                        <p className="text-xs text-(--muted-foreground)">Average</p>
                        <Badge variant={avg >= 70 ? "success" : avg >= 50 ? "warning" : "destructive"}>{avg}%</Badge>
                      </div>
                    )}
                    {predictedGrade && (
                      <div className="text-center">
                        <p className="text-xs text-(--muted-foreground)">GCSE Predicted</p>
                        <Badge variant="default">{gradeLabel(predictedGrade.grade)}</Badge>
                      </div>
                    )}
                    <div className="text-center">
                      <p className="text-xs text-(--muted-foreground)">Attendance</p>
                      <p className="font-bold">{attendancePercent(subjectPresent, subjectAttendances.length)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-(--muted-foreground)">Behaviour</p>
                      <p className="font-bold">{avgBeh ?? "—"}/5</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {subject.assignments.length === 0 ? (
                  <p className="text-sm text-(--muted-foreground)">No assignments yet.</p>
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
                        const isAssessment = a.type === "ASSESSMENT";
                        return (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.title}</TableCell>
                            <TableCell>
                              <Badge variant={isAssessment ? "secondary" : "outline"}>
                                {isAssessment ? "Assessment" : "Homework"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-(--muted-foreground)">{formatDate(a.deadline)}</TableCell>
                            <TableCell>
                              {mark?.marks !== null && mark?.marks !== undefined
                                ? `${mark.marks}/${a.maxMarks}`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {isAssessment ? (
                                <span className="text-(--muted-foreground) text-sm">—</span>
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
        {enrollments.length === 0 && (
          <Card><CardContent className="p-8 text-center text-(--muted-foreground)">Not enrolled in any subjects yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}
