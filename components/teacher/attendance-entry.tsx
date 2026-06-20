"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Subject, Student, Attendance, Class } from "@prisma/client";

type StudentWithAttendance = Student & {
  attendances: Attendance[];
  studentSubjects: { class: Class | null }[];
};

type MonthlyRecord = {
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
};

interface AttendanceEntryProps {
  subjects: Subject[];
  studentsWithAttendance: StudentWithAttendance[];
  teacherId: string;
  selectedSubjectId: string;
  selectedDate: string;
  selectedView: string;
  selectedMonth: string;
  monthlyRecords: MonthlyRecord[];
}

const statuses = ["PRESENT", "ABSENT", "LATE"] as const;
type AttStatus = (typeof statuses)[number];

const statusStyles: Record<AttStatus, string> = {
  PRESENT: "bg-green-100 text-green-700 border-green-300",
  ABSENT: "bg-red-100 text-red-700 border-red-300",
  LATE: "bg-amber-100 text-amber-700 border-amber-300",
};

const statusShort: Record<AttStatus, string> = {
  PRESENT: "P",
  ABSENT: "A",
  LATE: "L",
};

const classLabels: Record<string, string> = {
  YOUNGER_BOYS: "Younger Boys",
  OLDER_BOYS: "Older Boys",
  GIRLS: "Girls",
};

export function AttendanceEntry({
  subjects,
  studentsWithAttendance,
  teacherId,
  selectedSubjectId,
  selectedDate,
  selectedView,
  selectedMonth,
  monthlyRecords,
}: AttendanceEntryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [statusMap, setStatusMap] = useState<Record<string, AttStatus>>(() => {
    const initial: Record<string, AttStatus> = {};
    studentsWithAttendance.forEach((s) => {
      initial[s.id] = (s.attendances[0]?.status as AttStatus) ?? "PRESENT";
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [classFilter, setClassFilter] = useState("ALL");

  function navigate(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/teacher/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: selectedSubjectId,
        teacherId,
        date: selectedDate,
        records: studentsWithAttendance.map((s) => ({
          studentId: s.id,
          status: statusMap[s.id] ?? "PRESENT",
        })),
      }),
    });
    setSaving(false);
    router.refresh();
  }

  // Derive available classes from whichever tab's data is relevant
  const markClasses = [...new Set(studentsWithAttendance.flatMap((s) =>
    s.studentSubjects.map((ss) => ss.class?.name as string | undefined).filter((n): n is string => n !== undefined)
  ))].sort();
  const monthlyClasses = [...new Set(monthlyRecords.map((r) => r.className))].sort();

  // Filtered students for mark tab
  const filteredStudents =
    classFilter === "ALL"
      ? studentsWithAttendance
      : studentsWithAttendance.filter((s) => s.studentSubjects.some((ss) => ss.class?.name === classFilter));

  // Monthly view derived data
  const sessionDates = [...new Set(monthlyRecords.map((r) => r.date))].sort();

  type StudentGroup = { name: string; byDate: Record<string, AttStatus> };
  const studentGroups: Record<string, StudentGroup> = {};
  monthlyRecords
    .filter((r) => classFilter === "ALL" || r.className === classFilter)
    .forEach((r) => {
      if (!studentGroups[r.studentId]) {
        studentGroups[r.studentId] = { name: r.studentName, byDate: {} };
      }
      studentGroups[r.studentId].byDate[r.date] = r.status;
    });
  const studentsInMonth = Object.entries(studentGroups).sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  );

  const subjectSelector = (
    <div className="space-y-1.5 min-w-48">
      <Label>Subject</Label>
      <Select value={selectedSubjectId} onValueChange={(v) => navigate("subject", v)}>
        <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
        <SelectContent>
          {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  function ClassFilter({ classes }: { classes: string[] }) {
    if (classes.length === 0) return null;
    return (
      <div className="space-y-1.5 min-w-40">
        <Label>Class</Label>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c} value={c}>{classLabels[c] ?? c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={selectedView} onValueChange={(v) => { setClassFilter("ALL"); navigate("view", v); }}>
        <TabsList>
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
        </TabsList>

        {/* ── Mark Attendance ── */}
        <TabsContent value="mark">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Select Subject & Date</CardTitle></CardHeader>
              <CardContent className="flex gap-4 flex-wrap">
                {subjectSelector}
                <div className="space-y-1.5">
                  <Label>Session Date</Label>
                  <Input type="date" value={selectedDate} onChange={(e) => navigate("date", e.target.value)} />
                </div>
                <ClassFilter classes={markClasses} />
              </CardContent>
            </Card>

            {selectedSubjectId && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Mark Attendance</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2 text-xs">
                        {statuses.map((s) => (
                          <span key={s} className={cn("rounded px-2 py-0.5 border", statusStyles[s])}>{s}</span>
                        ))}
                      </div>
                      <Button onClick={handleSave} disabled={saving || studentsWithAttendance.length === 0}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredStudents.length === 0 ? (
                    <p className="text-sm text-(--muted-foreground)">No students enrolled in this subject from your classes.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {statuses.map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => setStatusMap((prev) => ({ ...prev, [student.id]: status }))}
                                    className={cn(
                                      "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                                      statusMap[student.id] === status
                                        ? statusStyles[status]
                                        : "bg-(--secondary) text-(--muted-foreground) border-transparent hover:bg-slate-200"
                                    )}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Monthly View ── */}
        <TabsContent value="monthly">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Select Subject & Month</CardTitle></CardHeader>
              <CardContent className="flex gap-4 flex-wrap">
                {subjectSelector}
                <div className="space-y-1.5">
                  <Label>Month</Label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => navigate("month", e.target.value)}
                  />
                </div>
                <ClassFilter classes={monthlyClasses} />
              </CardContent>
            </Card>

            {selectedSubjectId && (
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  {sessionDates.length === 0 ? (
                    <p className="text-sm text-(--muted-foreground)">No attendance records for this subject in the selected month.</p>
                  ) : studentsInMonth.length === 0 ? (
                    <p className="text-sm text-(--muted-foreground)">No students found for the selected class.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-36 sticky left-0 bg-white z-10">Student</TableHead>
                            {sessionDates.map((d) => (
                              <TableHead key={d} className="text-center min-w-14 text-xs whitespace-nowrap">
                                {new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                              </TableHead>
                            ))}
                            <TableHead className="text-center min-w-14 text-green-700">P</TableHead>
                            <TableHead className="text-center min-w-14 text-red-700">A</TableHead>
                            <TableHead className="text-center min-w-14 text-amber-700">L</TableHead>
                            <TableHead className="text-center min-w-16">Rate</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentsInMonth.map(([studentId, { name, byDate }]) => {
                            const present = Object.values(byDate).filter((s) => s === "PRESENT").length;
                            const absent = Object.values(byDate).filter((s) => s === "ABSENT").length;
                            const late = Object.values(byDate).filter((s) => s === "LATE").length;
                            const total = sessionDates.length;
                            const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
                            return (
                              <TableRow key={studentId}>
                                <TableCell className="font-medium sticky left-0 bg-white z-10 whitespace-nowrap">{name}</TableCell>
                                {sessionDates.map((d) => {
                                  const status = byDate[d];
                                  return (
                                    <TableCell key={d} className="text-center p-1">
                                      {status ? (
                                        <span className={cn("inline-block rounded px-1.5 py-0.5 text-xs font-semibold border", statusStyles[status])}>
                                          {statusShort[status]}
                                        </span>
                                      ) : (
                                        <span className="text-(--muted-foreground) text-xs">—</span>
                                      )}
                                    </TableCell>
                                  );
                                })}
                                <TableCell className="text-center text-sm text-green-700 font-medium">{present}</TableCell>
                                <TableCell className="text-center text-sm text-red-700 font-medium">{absent}</TableCell>
                                <TableCell className="text-center text-sm text-amber-700 font-medium">{late}</TableCell>
                                <TableCell className="text-center">
                                  <span className={cn(
                                    "text-xs font-semibold",
                                    rate >= 75 ? "text-green-700" : rate >= 50 ? "text-amber-700" : "text-red-700"
                                  )}>
                                    {rate}%
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
