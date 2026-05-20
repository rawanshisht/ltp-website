import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, ClipboardList, Bell } from "lucide-react";
import { formatDate } from "@/lib/utils";

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
    return <p className="text-[--muted-foreground]">Teacher profile not set up. Contact admin.</p>;
  }

  const subjects = teacher.teacherSubjects.map((ts) => ts.subject);
  const classes = teacher.teacherClasses.map((tc) => tc.class);
  const studentIds = classes.flatMap((c) => c.students.map((s) => s.id));
  const uniqueStudentCount = new Set(studentIds).size;

  const recentNotices = await prisma.notice.findMany({
    where: { teacherId: teacher.id },
    include: { subject: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const pendingDeadlines = await prisma.studentMark.count({
    where: {
      handedStatus: "PENDING",
      studentId: { in: studentIds },
      assignment: {
        teacherId: teacher.id,
        deadline: { lt: new Date() },
      },
    },
  });

  const classLabel = (name: string) =>
    name === "YOUNGER_BOYS" ? "Younger Boys" : name === "OLDER_BOYS" ? "Older Boys" : "Girls";

  return (
    <div>
      <Header title="Teacher Dashboard" description={`Welcome back, ${session!.user.name}`} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Subjects" value={subjects.length} icon={BookOpen} color="blue" />
        <StatCard label="Classes" value={classes.length} icon={Users} color="purple" />
        <StatCard label="Students" value={uniqueStudentCount} icon={Users} color="green" />
        <StatCard label="Overdue Submissions" value={pendingDeadlines} icon={ClipboardList} color="red" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
              <p className="text-sm text-[--muted-foreground]">No notices posted yet.</p>
            ) : (
              <div className="space-y-3">
                {recentNotices.map((n) => (
                  <div key={n.id} className="flex items-start justify-between gap-2 py-2 border-b border-[--border] last:border-0">
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-[--muted-foreground]">{n.subject.name}</p>
                    </div>
                    <span className="text-xs text-[--muted-foreground]">{formatDate(n.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
