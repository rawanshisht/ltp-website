import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, UserCog, Activity } from "lucide-react";
import { EnrollmentBarChart } from "@/components/charts/enrollment-bar-chart";

export default async function AdminDashboard() {
  const [studentCount, teacherCount, subjectCount, behaviourAvgData, recentStudents] =
    await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.teacher.count(),
      prisma.subject.count(),
      prisma.behaviour.aggregate({ _avg: { behaviourStars: true, attentiveStars: true, engagementStars: true } }),
      prisma.student.findMany({
        where: { isActive: true },
        include: { studentSubjects: { where: { droppedAt: null } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const allClasses = await prisma.class.findMany({ select: { id: true, name: true } });
  const [classCountsRaw, subjectEnrollments] = await Promise.all([
    Promise.all(
      allClasses.map(async (c) => ({
        name: c.name,
        _count: {
          students: await prisma.student.count({
            where: { isActive: true, studentSubjects: { some: { classId: c.id, droppedAt: null } } },
          }),
        },
      }))
    ),
    prisma.subject.findMany({
      include: { _count: { select: { studentSubjects: true } } },
      orderBy: { name: "asc" },
    }),
  ]);
  const classCounts = classCountsRaw;

  const chartHeight = Math.max(200, subjectEnrollments.length * 44);

  return (
    <div>
      <Header title="Admin Dashboard" description="Overall centre analytics" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Active Students" value={studentCount} icon={Users} color="blue" />
        <StatCard label="Teachers" value={teacherCount} icon={UserCog} color="purple" />
        <StatCard label="Subjects" value={subjectCount} icon={BookOpen} color="green" />
        <StatCard
          label="Avg Behaviour"
          value={behaviourAvgData._avg.behaviourStars
            ? `${(((behaviourAvgData._avg.behaviourStars ?? 0) + (behaviourAvgData._avg.attentiveStars ?? 0) + (behaviourAvgData._avg.engagementStars ?? 0)) / 3).toFixed(1)}/5`
            : "—"}
          icon={Activity}
          color="amber"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Students by Class</CardTitle></CardHeader>
          <CardContent>
            <EnrollmentBarChart
              data={classCounts.map((c) => ({ name: c.name, count: c._count.students }))}
              height={chartHeight}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subject Enrollments</CardTitle></CardHeader>
          <CardContent>
            <EnrollmentBarChart
              data={subjectEnrollments.map((s) => ({ name: s.name, count: s._count.studentSubjects }))}
              height={chartHeight}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Recently Added Students</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentStudents.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-(--border) last:border-0">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-(--muted-foreground)">{s.studentSubjects.length} subjects</p>
                  </div>
                  <Badge variant="secondary">{s.studentSubjects.length} subjects</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
