import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default async function AdminBehaviourPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; student?: string; class?: string }>;
}) {
  const { subject: subjectId, student: studentId, class: classId } = await searchParams;

  const [subjects, classes, students] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.class.findMany(),
    prisma.student.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const behaviours = await prisma.behaviour.findMany({
    where: {
      ...(subjectId && { subjectId }),
      ...(studentId && { studentId }),
      ...(classId && { student: { classId } }),
    },
    include: { student: true, subject: true, teacher: { include: { user: true } } },
    orderBy: { lessonDate: "desc" },
    take: 200,
  });

  const avgScore =
    behaviours.length > 0
      ? (behaviours.reduce((s, b) => s + b.score, 0) / behaviours.length).toFixed(1)
      : "—";

  const classLabel = (name: string) =>
    name === "YOUNGER_BOYS" ? "Younger Boys" : name === "OLDER_BOYS" ? "Older Boys" : "Girls";

  function scoreVariant(score: number) {
    if (score >= 4) return "success";
    if (score >= 3) return "warning";
    return "destructive";
  }

  return (
    <div>
      <Header title="Behaviour Dashboard" description="School-wide behaviour analytics" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form className="flex flex-wrap gap-3">
          <select name="subject" defaultValue={subjectId ?? ""} className="h-9 rounded-md border border-[--border] bg-white px-3 text-sm">
            <option value="">All subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="class" defaultValue={classId ?? ""} className="h-9 rounded-md border border-[--border] bg-white px-3 text-sm">
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{classLabel(c.name)}</option>)}
          </select>
          <select name="student" defaultValue={studentId ?? ""} className="h-9 rounded-md border border-[--border] bg-white px-3 text-sm">
            <option value="">All students</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button type="submit" className="h-9 px-4 rounded-md bg-[--primary] text-white text-sm font-medium">Filter</button>
          <a href="/admin/behaviour" className="h-9 px-4 rounded-md border border-[--border] text-sm flex items-center">Clear</a>
        </form>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="rounded-xl bg-blue-50 px-4 py-3">
          <p className="text-xs text-blue-600">Records shown</p>
          <p className="text-xl font-bold text-blue-700">{behaviours.length}</p>
        </div>
        <div className="rounded-xl bg-green-50 px-4 py-3">
          <p className="text-xs text-green-600">Average score</p>
          <p className="text-xl font-bold text-green-700">{avgScore}/5</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Behaviour Records</CardTitle></CardHeader>
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
                  <TableHead>Score</TableHead>
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
                    <TableCell><Badge variant={scoreVariant(b.score)}>{b.score}/5</Badge></TableCell>
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
