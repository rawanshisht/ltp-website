import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { formatDate } from "@/lib/utils";

function severityVariant(s: string) {
  if (s === "MAJOR") return "destructive";
  if (s === "MODERATE") return "warning";
  return "secondary";
}

export default async function ParentIncidentsPage({
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

  const incidents = await prisma.incidentLog.findMany({
    where: { studentId: selected.id },
    include: { subject: true, teacher: { include: { user: true } } },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <Header
        title="Incident Log"
        description={`Behaviour incidents for ${selected.name}`}
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      {incidents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[--muted-foreground]">No incidents recorded.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Incident Records</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell className="text-[--muted-foreground] whitespace-nowrap">{formatDate(inc.date)}</TableCell>
                    <TableCell className="font-medium">{inc.title}</TableCell>
                    <TableCell>{inc.subject?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(inc.severity)}>
                        {inc.severity.charAt(0) + inc.severity.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[--muted-foreground]">
                      {inc.teacher.user.firstName} {inc.teacher.user.lastName}
                    </TableCell>
                    <TableCell className="text-[--muted-foreground] text-sm">{inc.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
