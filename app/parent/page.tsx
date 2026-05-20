import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Activity, CalendarCheck, ClipboardList } from "lucide-react";
import { formatDate, gradeLabel, attendancePercent } from "@/lib/utils";
import { ChildSwitcher } from "@/components/parent/child-switcher";

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
      parentStudents: {
        include: {
          student: { include: { class: true } },
        },
      },
    },
  });

  if (!parent || parent.parentStudents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[--muted-foreground]">No children linked to your account. Contact admin.</p>
      </div>
    );
  }

  const children = parent.parentStudents.map((ps) => ps.student);
  const selected = children.find((c) => c.id === childId) ?? children[0];

  const [subjectEnrollments, behaviours, attendances, upcomingDeadlines, predictedGrades] =
    await Promise.all([
      prisma.studentSubject.findMany({
        where: { studentId: selected.id, droppedAt: null },
        include: { subject: true },
      }),
      prisma.behaviour.findMany({
        where: { studentId: selected.id },
        select: { score: true, subjectId: true },
      }),
      prisma.attendance.findMany({
        where: { studentId: selected.id },
        select: { status: true },
      }),
      prisma.studentMark.findMany({
        where: {
          studentId: selected.id,
          handedStatus: "PENDING",
          assignment: { deadline: { gte: new Date() } },
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
  const avgBehaviour =
    behaviours.length > 0
      ? (behaviours.reduce((s, b) => s + b.score, 0) / behaviours.length).toFixed(1)
      : "—";

  const className =
    selected.class.name === "YOUNGER_BOYS"
      ? "Younger Boys"
      : selected.class.name === "OLDER_BOYS"
      ? "Older Boys"
      : "Girls";

  return (
    <div>
      <Header
        title={`Welcome back`}
        description="Overview of your child's progress"
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      {/* Child info */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <p className="text-blue-100 text-sm mb-1">Currently viewing</p>
        <h2 className="text-xl font-bold">{selected.name}</h2>
        <p className="text-blue-200 text-sm mt-1">{className} Class · {subjectEnrollments.length} subjects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Subjects" value={subjectEnrollments.length} icon={BookOpen} color="blue" />
        <StatCard label="Avg Behaviour" value={`${avgBehaviour}/5`} icon={Activity} color="green" />
        <StatCard
          label="Attendance"
          value={`${attendancePercent(presentCount, totalSessions)}%`}
          icon={CalendarCheck}
          color="amber"
          trend={`${presentCount}/${totalSessions} sessions`}
        />
        <StatCard label="Pending Deadlines" value={upcomingDeadlines.length} icon={ClipboardList} color="red" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Predicted Grades */}
        <Card>
          <CardHeader>
            <CardTitle>Predicted GCSE Grades</CardTitle>
          </CardHeader>
          <CardContent>
            {predictedGrades.length === 0 ? (
              <p className="text-sm text-[--muted-foreground]">No predicted grades yet.</p>
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

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-[--muted-foreground]">No upcoming deadlines.</p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((m) => (
                  <div key={m.id} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{m.assignment.title}</p>
                      <p className="text-xs text-[--muted-foreground]">{m.assignment.subject.name}</p>
                    </div>
                    <Badge variant="warning">{formatDate(m.assignment.deadline)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subjects summary */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Enrolled Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {subjectEnrollments.map((se) => (
                <Badge key={se.id} variant={se.subject.type === "CORE" ? "default" : "secondary"}>
                  {se.subject.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
