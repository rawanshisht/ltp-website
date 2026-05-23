import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/layout/stat-card";
import { AttendanceRecordsTable } from "@/components/admin/attendance-records-table";
import { attendancePercent } from "@/lib/utils";
import { CalendarCheck, CalendarX, Clock, Users } from "lucide-react";
import { AttendanceDonut } from "@/components/charts/attendance-donut";
import { StudentAttendanceChart } from "@/components/admin/student-attendance-chart";

export const dynamic = "force-dynamic";

export default async function AdminAttendancePage() {
  const [subjects, students, attendances, allAttendancesForChart] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.student.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.attendance.findMany({
      include: { student: true, subject: true },
      orderBy: { sessionDate: "desc" },
      take: 300,
    }),
    prisma.attendance.findMany({
      select: { status: true, student: { select: { name: true } } },
    }),
  ]);

  const present = attendances.filter((a) => a.status === "PRESENT").length;
  const absent = attendances.filter((a) => a.status === "ABSENT").length;
  const late = attendances.filter((a) => a.status === "LATE").length;

  const chartPresent = allAttendancesForChart.filter((a) => a.status === "PRESENT").length;
  const chartAbsent = allAttendancesForChart.filter((a) => a.status === "ABSENT").length;
  const chartLate = allAttendancesForChart.filter((a) => a.status === "LATE").length;

  const byStudent = allAttendancesForChart.reduce<Record<string, { present: number; total: number }>>((acc, a) => {
    const key = a.student.name;
    acc[key] = acc[key] ?? { present: 0, total: 0 };
    acc[key].total++;
    if (a.status === "PRESENT") acc[key].present++;
    return acc;
  }, {});
  const studentAttendanceData = Object.entries(byStudent)
    .map(([fullName, { present, total }]) => ({
      name: fullName.split(" ")[0],
      fullName,
      pct: Math.round((present / total) * 100),
    }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <div>
      <Header title="Attendance Dashboard" description="School-wide attendance analytics" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Total Sessions" value={attendances.length} icon={Users} color="blue" />
        <StatCard label="Present" value={present} icon={CalendarCheck} color="green" trend={`${attendancePercent(present, attendances.length)}%`} />
        <StatCard label="Absent" value={absent} icon={CalendarX} color="red" />
        <StatCard label="Late" value={late} icon={Clock} color="amber" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle>Attendance Breakdown</CardTitle></CardHeader>
          <CardContent>
            <AttendanceDonut present={chartPresent} absent={chartAbsent} late={chartLate} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Attendance by Student</CardTitle></CardHeader>
          <CardContent>
            <StudentAttendanceChart data={studentAttendanceData} students={students} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Attendance Records ({attendances.length})</CardTitle></CardHeader>
        <CardContent>
          <AttendanceRecordsTable records={attendances} subjects={subjects} students={students} />
        </CardContent>
      </Card>
    </div>
  );
}
