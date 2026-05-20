import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, UserCog, Activity } from "lucide-react";

export default async function AdminDashboard() {
  const [studentCount, teacherCount, subjectCount, behaviourAvgData, recentStudents] =
    await Promise.all([
      prisma.student.count({ where: { isActive: true } }),
      prisma.teacher.count(),
      prisma.subject.count(),
      prisma.behaviour.aggregate({ _avg: { score: true } }),
      prisma.student.findMany({
        where: { isActive: true },
        include: { class: true, studentSubjects: { where: { droppedAt: null } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const classLabel = (name: string) =>
    name === "YOUNGER_BOYS" ? "Younger Boys" : name === "OLDER_BOYS" ? "Older Boys" : "Girls";

  const [classCounts, subjectEnrollments] = await Promise.all([
    prisma.class.findMany({
      include: { _count: { select: { students: true } } },
    }),
    prisma.subject.findMany({
      include: { _count: { select: { studentSubjects: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <Header title="Admin Dashboard" description="Overall centre analytics" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Active Students" value={studentCount} icon={Users} color="blue" />
        <StatCard label="Teachers" value={teacherCount} icon={UserCog} color="purple" />
        <StatCard label="Subjects" value={subjectCount} icon={BookOpen} color="green" />
        <StatCard
          label="Avg Behaviour"
          value={behaviourAvgData._avg.score ? `${behaviourAvgData._avg.score.toFixed(1)}/5` : "—"}
          icon={Activity}
          color="amber"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Class breakdown */}
        <Card>
          <CardHeader><CardTitle>Students by Class</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {classCounts.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <span className="text-sm font-medium">{classLabel(c.name)}</span>
                <Badge variant="secondary">{c._count.students} students</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Subject enrollment */}
        <Card>
          <CardHeader><CardTitle>Subject Enrollments</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {subjectEnrollments.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{s.name}</span>
                  <Badge variant={s.type === "CORE" ? "default" : "secondary"} className="text-xs">
                    {s.type}
                  </Badge>
                </div>
                <Badge variant="outline">{s._count.studentSubjects} students</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent students */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Recently Added Students</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentStudents.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-[--border] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-[--muted-foreground]">{classLabel(s.class.name)}</p>
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
