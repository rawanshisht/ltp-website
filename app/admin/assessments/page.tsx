import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Calendar } from "lucide-react";

export default async function AdminAssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject: subjectId } = await searchParams;

  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });

  const assessments = await prisma.assignment.findMany({
    where: {
      type: "ASSESSMENT",
      ...(subjectId && { subjectId }),
    },
    include: {
      subject: true,
      teacher: { include: { user: true } },
      marks: {
        include: { student: true },
      },
    },
    orderBy: { deadline: "asc" },
  });

  const upcoming = assessments.filter((a) => new Date(a.deadline) >= new Date());
  const past = assessments.filter((a) => new Date(a.deadline) < new Date());

  function AssessmentCard({ a }: { a: (typeof assessments)[0] }) {
    const handed = a.marks.filter((m) => m.handedStatus === "HANDED").length;
    const markedMarks = a.marks.filter((m) => m.marks !== null);
    const avgScore = markedMarks.length > 0
      ? Math.round(markedMarks.reduce((s, m) => s + (m.marks ?? 0), 0) / markedMarks.length)
      : null;

    return (
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[--muted-foreground]" />
            <span className="font-medium">{a.title}</span>
          </div>
        </TableCell>
        <TableCell><Badge variant="secondary">{a.subject.name}</Badge></TableCell>
        <TableCell>
          <Badge variant={new Date(a.deadline).getMonth() === 5 ? "warning" : "default"}>
            {formatDate(a.deadline)}
          </Badge>
        </TableCell>
        <TableCell className="text-[--muted-foreground]">
          {a.teacher.user.firstName} {a.teacher.user.lastName}
        </TableCell>
        <TableCell>
          {handed}/{a.marks.length} submitted
        </TableCell>
        <TableCell>
          {avgScore !== null ? `${avgScore}/${a.maxMarks}` : "—"}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div>
      <Header title="Assessments" description="Assessment schedule — end of June summer break" />

      {/* Filter */}
      <form className="flex gap-3 mb-6">
        <select name="subject" defaultValue={subjectId ?? ""} className="h-9 rounded-md border border-[--border] bg-white px-3 text-sm">
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="submit" className="h-9 px-4 rounded-md bg-[--primary] text-white text-sm font-medium">Filter</button>
        <a href="/admin/assessments" className="h-9 px-4 rounded-md border border-[--border] text-sm flex items-center">Clear</a>
      </form>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upcoming Assessments</CardTitle>
          <p className="text-sm text-[--muted-foreground]">End of June — before summer break</p>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-[--muted-foreground]">No upcoming assessments.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Avg Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((a) => <AssessmentCard key={a.id} a={a} />)}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Past Assessments</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Avg Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {past.map((a) => <AssessmentCard key={a.id} a={a} />)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
