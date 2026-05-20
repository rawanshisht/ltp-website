import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { formatDate } from "@/lib/utils";

function scoreVariant(score: number) {
  if (score >= 4) return "success";
  if (score >= 3) return "warning";
  return "destructive";
}

export default async function ParentBehaviourPage({
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

  const behaviours = await prisma.behaviour.findMany({
    where: { studentId: selected.id },
    include: { subject: true },
    orderBy: { lessonDate: "desc" },
  });

  const bySubject = behaviours.reduce<Record<string, typeof behaviours>>(
    (acc, b) => {
      const key = b.subject.name;
      acc[key] = acc[key] ?? [];
      acc[key].push(b);
      return acc;
    },
    {}
  );

  return (
    <div>
      <Header
        title="Behaviour & Attainment"
        description={`Behaviour records for ${selected.name}`}
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      {/* Per-subject averages */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        {Object.entries(bySubject).map(([subject, records]) => {
          const avg = (records.reduce((s, r) => s + r.score, 0) / records.length).toFixed(1);
          return (
            <Card key={subject}>
              <CardContent className="p-4">
                <p className="text-sm text-[--muted-foreground] mb-1">{subject}</p>
                <p className="text-2xl font-bold">{avg}<span className="text-sm font-normal text-[--muted-foreground]">/5</span></p>
                <p className="text-xs text-[--muted-foreground]">{records.length} records</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full log */}
      <Card>
        <CardHeader>
          <CardTitle>Behaviour Log</CardTitle>
        </CardHeader>
        <CardContent>
          {behaviours.length === 0 ? (
            <p className="text-sm text-[--muted-foreground]">No behaviour records yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Teacher Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {behaviours.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-[--muted-foreground]">{formatDate(b.lessonDate)}</TableCell>
                    <TableCell className="font-medium">{b.subject.name}</TableCell>
                    <TableCell>
                      <Badge variant={scoreVariant(b.score)}>{b.score}/5</Badge>
                    </TableCell>
                    <TableCell className="text-[--muted-foreground] italic">
                      {b.note ?? "—"}
                    </TableCell>
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
