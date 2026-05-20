import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/layout/stat-card";
import { formatDate, attendancePercent } from "@/lib/utils";
import { CalendarCheck, CalendarX, Clock, Users } from "lucide-react";

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; student?: string; class?: string }>;
}) {
  const { subject: subjectId, student: studentId, class: classId } = await searchParams;

  const [subjects, classes, students] = await Promise.all([
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.class.findMany(),
    prisma.student.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const attendances = await prisma.attendance.findMany({
    where: {
      ...(subjectId && { subjectId }),
      ...(studentId && { studentId }),
      ...(classId && { student: { classId } }),
    },
    include: { student: true, subject: true },
    orderBy: { sessionDate: "desc" },
    take: 200,
  });

  const present = attendances.filter((a) => a.status === "PRESENT").length;
  const absent = attendances.filter((a) => a.status === "ABSENT").length;
  const late = attendances.filter((a) => a.status === "LATE").length;

  const classLabel = (name: string) =>
    name === "YOUNGER_BOYS" ? "Younger Boys" : name === "OLDER_BOYS" ? "Older Boys" : "Girls";

  return (
    <div>
      <Header title="Attendance Dashboard" description="School-wide attendance analytics" />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form className="flex flex-wrap gap-3">
          <select name="subject" defaultValue={subjectId ?? ""} className="h-9 rounded-md border border-[--border] bg-white px-3 text-sm">
            <option value="">All subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="class" defaultValue={classId ?? ""} className="h-9 rounded-md border border-[--border] bg-white px-3 text-sm">
            <option value="">All classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{classLabel(c.name)}</option>)}
          </select>
          <select name="student" defaultValue={studentId ?? ""} className="h-9 rounded-md border border-[--border] bg-white px-3 text-sm">
            <option value="">All students</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button type="submit" className="h-9 px-4 rounded-md bg-[--primary] text-white text-sm font-medium">Filter</button>
          <a href="/admin/attendance" className="h-9 px-4 rounded-md border border-[--border] text-sm flex items-center">Clear</a>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Total Sessions" value={attendances.length} icon={Users} color="blue" />
        <StatCard label="Present" value={present} icon={CalendarCheck} color="green" trend={`${attendancePercent(present, attendances.length)}%`} />
        <StatCard label="Absent" value={absent} icon={CalendarX} color="red" />
        <StatCard label="Late" value={late} icon={Clock} color="amber" />
      </div>

      <Card>
        <CardHeader><CardTitle>Attendance Records</CardTitle></CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <p className="text-sm text-[--muted-foreground] py-4">No records found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.student.name}</TableCell>
                    <TableCell>{a.subject.name}</TableCell>
                    <TableCell className="text-[--muted-foreground]">{formatDate(a.sessionDate)}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "PRESENT" ? "success" : a.status === "ABSENT" ? "destructive" : "warning"}>
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
