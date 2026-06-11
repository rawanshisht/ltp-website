import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IncidentFilters } from "@/components/admin/incident-filters";
import { AdminIncidentsTable } from "@/components/admin/admin-incidents-table";

export const dynamic = "force-dynamic";

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
            <AdminIncidentsTable incidents={incidents} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
