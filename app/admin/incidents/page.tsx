import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IncidentFilters } from "@/components/admin/incident-filters";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function severityVariant(s: string) {
  if (s === "MAJOR") return "destructive";
  if (s === "MODERATE") return "warning";
  return "success";
}

export default async function AdminIncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; severity?: string }>;
}) {
  const { student: studentId, severity } = await searchParams;

  const students = await prisma.student.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  const incidents = await prisma.incidentLog.findMany({
    where: {
      ...(studentId && { studentId }),
      ...(severity && { severity: severity as "MINOR" | "MODERATE" | "MAJOR" }),
    },
    include: {
      student: true,
      subject: true,
      teacher: { include: { user: true } },
    },
    orderBy: { date: "desc" },
  });

  const majorCount = incidents.filter((i) => i.severity === "MAJOR").length;
  const moderateCount = incidents.filter((i) => i.severity === "MODERATE").length;
  const minorCount = incidents.filter((i) => i.severity === "MINOR").length;

  return (
    <div>
      <Header title="Incident Log" description="School-wide incident records" />

      {/* Summary stats */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="rounded-xl bg-red-50 px-4 py-3">
          <p className="text-xs text-red-600">Major</p>
          <p className="text-xl font-bold text-red-700">{majorCount}</p>
        </div>
        <div className="rounded-xl bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-600">Moderate</p>
          <p className="text-xl font-bold text-amber-700">{moderateCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-600">Minor</p>
          <p className="text-xl font-bold text-slate-700">{minorCount}</p>
        </div>
      </div>

      <IncidentFilters
        students={students}
        currentStudentId={studentId ?? ""}
        currentSeverity={severity ?? ""}
      />

      <Card>
        <CardHeader><CardTitle>All Incidents ({incidents.length})</CardTitle></CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-sm text-(--muted-foreground) py-4">No incidents found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Logged by</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell className="text-(--muted-foreground) whitespace-nowrap">{formatDate(inc.date)}</TableCell>
                    <TableCell className="font-medium">{inc.student.name}</TableCell>
                    <TableCell>{inc.title}</TableCell>
                    <TableCell>{inc.subject?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(inc.severity)}>
                        {inc.severity.charAt(0) + inc.severity.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-(--muted-foreground)">
                      {inc.teacher.user.firstName} {inc.teacher.user.lastName}
                    </TableCell>
                    <TableCell className="text-(--muted-foreground) text-sm max-w-xs">
                      {inc.description}
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
