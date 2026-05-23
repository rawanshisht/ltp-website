import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/layout/stat-card";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { formatDate, attendancePercent } from "@/lib/utils";
import { CalendarCheck, CalendarX, Clock } from "lucide-react";
import { AttendanceDonut } from "@/components/charts/attendance-donut";
import { AttendanceBarChart } from "@/components/charts/enrollment-bar-chart";

export default async function ParentAttendancePage({
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

  const attendances = await prisma.attendance.findMany({
    where: { studentId: selected.id },
    include: { subject: true },
    orderBy: { sessionDate: "desc" },
  });

  const present = attendances.filter((a) => a.status === "PRESENT").length;
  const absent = attendances.filter((a) => a.status === "ABSENT").length;
  const late = attendances.filter((a) => a.status === "LATE").length;
  const total = attendances.length;

  const bySubject = attendances.reduce<Record<string, { present: number; total: number }>>((acc, a) => {
    const key = a.subject.name;
    acc[key] = acc[key] ?? { present: 0, total: 0 };
    acc[key].total++;
    if (a.status === "PRESENT") acc[key].present++;
    return acc;
  }, {});
  const subjectAttendanceData = Object.entries(bySubject)
    .map(([name, { present, total }]) => ({ name, pct: Math.round((present / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <div>
      <Header
        title="Attendance"
        description={`Attendance records for ${selected.name}`}
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Attendance Rate" value={`${attendancePercent(present, total)}%`} icon={CalendarCheck} color="green" trend={`${total} total sessions`} />
        <StatCard label="Present" value={present} icon={CalendarCheck} color="green" />
        <StatCard label="Absent" value={absent} icon={CalendarX} color="red" />
        <StatCard label="Late" value={late} icon={Clock} color="amber" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle>Attendance Breakdown</CardTitle></CardHeader>
          <CardContent>
            <AttendanceDonut present={present} absent={absent} late={late} />
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader><CardTitle>Attendance by Subject</CardTitle></CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="w-full">
              <AttendanceBarChart data={subjectAttendanceData} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Log</CardTitle>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <p className="text-sm text-(--muted-foreground)">No attendance records yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-(--muted-foreground)">{formatDate(a.sessionDate)}</TableCell>
                    <TableCell className="font-medium">{a.subject.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          a.status === "PRESENT"
                            ? "success"
                            : a.status === "ABSENT"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {a.status}
                      </Badge>
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
