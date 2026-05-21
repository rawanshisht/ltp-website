import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RecordFilters } from "@/components/admin/record-filters";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function starDisplay(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

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

export default async function AdminBehaviourPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; student?: string; class?: string; date?: string }>;
}) {
  const { subject: subjectId, student: studentId, class: classId, date } = await searchParams;

  const [subjects, classes, students] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.class.findMany(),
    prisma.student.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const dateFilter = date ? new Date(date) : undefined;

  const behaviours = await prisma.behaviour.findMany({
    where: {
      ...(subjectId && { subjectId }),
      ...(studentId && { studentId }),
      ...(classId && { student: { classId } }),
      ...(dateFilter && {
        lessonDate: {
          gte: dateFilter,
          lt: new Date(dateFilter.getTime() + 86400000),
        },
      }),
    },
    include: { student: true, subject: true, teacher: { include: { user: true } } },
    orderBy: { lessonDate: "desc" },
    take: 200,
  });

  const byStudent = behaviours.reduce<Record<string, typeof behaviours>>((acc, b) => {
    acc[b.student.name] = acc[b.student.name] ?? [];
    acc[b.student.name].push(b);
    return acc;
  }, {});

  return (
    <div>
      <Header title="Behaviour Dashboard" description="School-wide behaviour analytics" />

      <RecordFilters
        subjects={subjects}
        students={students}
        classes={classes}
        clearHref="/admin/behaviour"
        currentSubjectId={subjectId ?? ""}
        currentStudentId={studentId ?? ""}
        currentDate={date ?? ""}
        currentClassId={classId ?? ""}
        showClass
      />

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
                  <p className="text-xs text-[--muted-foreground]">{records.length} sessions</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-[--muted-foreground] mb-1">Behaviour</p>
                    <MiniBarChart value={avgB} color="bg-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-[--muted-foreground] mb-1">Attentive</p>
                    <MiniBarChart value={avgA} color="bg-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-[--muted-foreground] mb-1">Engagement</p>
                    <MiniBarChart value={avgE} color="bg-amber-500" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Behaviour Records ({behaviours.length})</CardTitle></CardHeader>
        <CardContent>
          {behaviours.length === 0 ? (
            <p className="text-sm text-[--muted-foreground] py-4">No records found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Behaviour</TableHead>
                  <TableHead>Attentive</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {behaviours.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.student.name}</TableCell>
                    <TableCell>{b.subject.name}</TableCell>
                    <TableCell className="text-[--muted-foreground]">{formatDate(b.lessonDate)}</TableCell>
                    <TableCell><span className="text-amber-400 text-sm">{starDisplay(b.behaviourStars)}</span></TableCell>
                    <TableCell><span className="text-amber-400 text-sm">{starDisplay(b.attentiveStars)}</span></TableCell>
                    <TableCell><span className="text-amber-400 text-sm">{starDisplay(b.engagementStars)}</span></TableCell>
                    <TableCell className="text-[--muted-foreground]">{b.teacher.user.firstName} {b.teacher.user.lastName}</TableCell>
                    <TableCell className="text-[--muted-foreground] italic">{b.note ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
