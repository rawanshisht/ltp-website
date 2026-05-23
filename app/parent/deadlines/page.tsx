import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ParentDeadlinesPage({
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

  const marks = await prisma.studentMark.findMany({
    where: { studentId: selected.id },
    include: { assignment: { include: { subject: true } } },
    orderBy: { assignment: { deadline: "asc" } },
  });

  const upcoming = marks.filter(
    (m) => new Date(m.assignment.deadline) >= new Date() && m.handedStatus === "PENDING"
  );
  const past = marks.filter(
    (m) => new Date(m.assignment.deadline) < new Date() || m.handedStatus !== "PENDING"
  );

  return (
    <div>
      <Header
        title="Deadlines"
        description={`All assignments for ${selected.name}`}
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Upcoming Deadlines</CardTitle></CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-(--muted-foreground)">No upcoming deadlines.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcoming.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.assignment.title}</TableCell>
                      <TableCell>{m.assignment.subject.name}</TableCell>
                      <TableCell>
                        <Badge variant={m.assignment.type === "ASSESSMENT" ? "secondary" : "outline"}>
                          {m.assignment.type === "ASSESSMENT" ? "Assessment" : "Homework"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="warning">{formatDate(m.assignment.deadline)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Past Assignments</CardTitle></CardHeader>
          <CardContent>
            {past.length === 0 ? (
              <p className="text-sm text-(--muted-foreground)">No past assignments.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {past.map((m) => {
                    const isAssessment = m.assignment.type === "ASSESSMENT";
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.assignment.title}</TableCell>
                        <TableCell>{m.assignment.subject.name}</TableCell>
                        <TableCell className="text-(--muted-foreground)">{formatDate(m.assignment.deadline)}</TableCell>
                        <TableCell>
                          {isAssessment ? (
                            <span className="text-(--muted-foreground) text-sm">—</span>
                          ) : (
                            <Badge variant={
                              m.handedStatus === "HANDED" ? "success"
                              : m.handedStatus === "OVERDUE" ? "destructive"
                              : "secondary"
                            }>
                              {m.handedStatus}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {m.marks !== null ? `${m.marks}/${m.assignment.maxMarks}` : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
