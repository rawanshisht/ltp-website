import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BehaviourRecordsTable } from "@/components/admin/behaviour-records-table";
import { StudentBehaviourChart } from "@/components/admin/student-behaviour-chart";

export const dynamic = "force-dynamic";

function MiniBarChart({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

export default async function AdminBehaviourPage() {
  const [subjects, students, behaviours, allBehavioursForChart] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.student.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.behaviour.findMany({
      include: { student: true, subject: true, teacher: { include: { user: true } } },
      orderBy: { lessonDate: "desc" },
      take: 300,
    }),
    prisma.behaviour.findMany({
      select: { behaviourStars: true, attentiveStars: true, engagementStars: true, student: { select: { name: true } } },
    }),
  ]);

  const byStudent = behaviours.reduce<Record<string, typeof behaviours>>((acc, b) => {
    acc[b.student.name] = acc[b.student.name] ?? [];
    acc[b.student.name].push(b);
    return acc;
  }, {});

  const chartByStudent = allBehavioursForChart.reduce<Record<string, { b: number; a: number; e: number; n: number }>>((acc, r) => {
    const key = r.student.name;
    acc[key] = acc[key] ?? { b: 0, a: 0, e: 0, n: 0 };
    acc[key].b += r.behaviourStars;
    acc[key].a += r.attentiveStars;
    acc[key].e += r.engagementStars;
    acc[key].n++;
    return acc;
  }, {});
  const behaviourChartData = Object.entries(chartByStudent).map(([fullName, { b, a, e, n }]) => ({
    name: fullName.split(" ")[0],
    fullName,
    behaviour: parseFloat((b / n).toFixed(1)),
    attentive: parseFloat((a / n).toFixed(1)),
    engagement: parseFloat((e / n).toFixed(1)),
  }));

  return (
    <div>
      <Header title="Behaviour Dashboard" description="School-wide behaviour analytics" />

      {behaviourChartData.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>School-wide Behaviour Overview</CardTitle></CardHeader>
          <CardContent>
            <StudentBehaviourChart data={behaviourChartData} students={students} />
          </CardContent>
        </Card>
      )}

      {/* Per-student summary charts */}
      {Object.keys(byStudent).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Object.entries(byStudent).map(([name, records]) => {
            const avgB = records.reduce((s, r) => s + r.behaviourStars, 0) / records.length;
            const avgA = records.reduce((s, r) => s + r.attentiveStars, 0) / records.length;
            const avgE = records.reduce((s, r) => s + r.engagementStars, 0) / records.length;
            return (
              <Card key={name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{name}</CardTitle>
                  <p className="text-xs text-(--muted-foreground)">{records.length} sessions</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-(--muted-foreground) mb-1">Behaviour</p>
                    <MiniBarChart value={avgB} color="bg-[#00dcde]" />
                  </div>
                  <div>
                    <p className="text-xs text-(--muted-foreground) mb-1">Attentive</p>
                    <MiniBarChart value={avgA} color="bg-[#ff00bf]" />
                  </div>
                  <div>
                    <p className="text-xs text-(--muted-foreground) mb-1">Engagement</p>
                    <MiniBarChart value={avgE} color="bg-[#ff9752]" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filterable records table */}
      <Card>
        <CardHeader><CardTitle>Behaviour Records ({behaviours.length})</CardTitle></CardHeader>
        <CardContent>
          <BehaviourRecordsTable records={behaviours} subjects={subjects} students={students} />
        </CardContent>
      </Card>
    </div>
  );
}
