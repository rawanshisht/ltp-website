import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { formatDate } from "@/lib/utils";
import { Calendar } from "lucide-react";

export default async function ParentAssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await auth();
  const { child: childId } = await searchParams;

  const parent = await prisma.parent.findUnique({
    where: { userId: session!.user.id },
    include: { parentStudents: { include: { student: true } } },
  });

  const children = parent!.parentStudents.map((ps) => ps.student);
  const selected = children.find((c) => c.id === childId) ?? children[0];

  const assessmentMarks = await prisma.studentMark.findMany({
    where: {
      studentId: selected.id,
      assignment: { type: "ASSESSMENT" },
    },
    include: {
      assignment: { include: { subject: true } },
    },
    orderBy: { assignment: { deadline: "asc" } },
  });

  const upcoming = assessmentMarks.filter((m) => new Date(m.assignment.deadline) >= new Date());
  const past = assessmentMarks.filter((m) => new Date(m.assignment.deadline) < new Date());

  function AssessmentRow({ m }: { m: (typeof assessmentMarks)[0] }) {
    const a = m.assignment;
    const isPast = new Date(a.deadline) < new Date();
    return (
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-(--muted-foreground)" />
            <span className="font-medium">{a.title}</span>
          </div>
        </TableCell>
        <TableCell><Badge variant="secondary">{a.subject.name}</Badge></TableCell>
        <TableCell>
          <Badge variant={isPast ? "secondary" : new Date(a.deadline).getMonth() === 5 ? "warning" : "default"}>
            {formatDate(a.deadline)}
          </Badge>
        </TableCell>
        <TableCell>
          {m.marks !== null && m.marks !== undefined
            ? <Badge variant={m.marks / a.maxMarks >= 0.7 ? "success" : m.marks / a.maxMarks >= 0.5 ? "warning" : "destructive"}>
                {m.marks}/{a.maxMarks} ({Math.round((m.marks / a.maxMarks) * 100)}%)
              </Badge>
            : <span className="text-(--muted-foreground) text-sm">Not yet marked</span>}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div>
      <Header
        title="Assessments"
        description={`Assessment schedule and results for ${selected.name}`}
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      {/* Upcoming */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upcoming Assessments</CardTitle>
          <p className="text-sm text-(--muted-foreground)">Key assessment dates — June and November periods</p>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-(--muted-foreground)">No upcoming assessments.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((m) => <AssessmentRow key={m.id} m={m} />)}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Past */}
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
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {past.map((m) => <AssessmentRow key={m.id} m={m} />)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
