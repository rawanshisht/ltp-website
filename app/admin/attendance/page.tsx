import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/layout/stat-card";
import { AttendanceRecordsTable } from "@/components/admin/attendance-records-table";
import { attendancePercent } from "@/lib/utils";
import { CalendarCheck, CalendarX, Clock, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAttendancePage() {
  const [subjects, students, attendances] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.student.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.attendance.findMany({
      include: { student: true, subject: true },
      orderBy: { sessionDate: "desc" },
      take: 300,
    }),
  ]);

  const present = attendances.filter((a) => a.status === "PRESENT").length;
  const absent = attendances.filter((a) => a.status === "ABSENT").length;
  const late = attendances.filter((a) => a.status === "LATE").length;

  return (
    <div>
      <Header title="Attendance Dashboard" description="School-wide attendance analytics" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Total Sessions" value={attendances.length} icon={Users} color="blue" />
        <StatCard label="Present" value={present} icon={CalendarCheck} color="green" trend={`${attendancePercent(present, attendances.length)}%`} />
        <StatCard label="Absent" value={absent} icon={CalendarX} color="red" />
        <StatCard label="Late" value={late} icon={Clock} color="amber" />
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
