"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Subject, Student, Attendance } from "@prisma/client";

type StudentWithAttendance = Student & { attendances: Attendance[] };

interface AttendanceEntryProps {
  subjects: Subject[];
  studentsWithAttendance: StudentWithAttendance[];
  teacherId: string;
  selectedSubjectId: string;
  selectedDate: string;
}

const statuses = ["PRESENT", "ABSENT", "LATE"] as const;
type AttStatus = (typeof statuses)[number];

const statusStyles: Record<AttStatus, string> = {
  PRESENT: "bg-green-100 text-green-700 border-green-300",
  ABSENT: "bg-red-100 text-red-700 border-red-300",
  LATE: "bg-amber-100 text-amber-700 border-amber-300",
};

export function AttendanceEntry({
  subjects,
  studentsWithAttendance,
  teacherId,
  selectedSubjectId,
  selectedDate,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Select Subject & Date</CardTitle></CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div className="space-y-1.5 min-w-48">
            <Label>Subject</Label>
            <Select value={selectedSubjectId} onValueChange={(v) => navigate("subject", v)}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Session Date</Label>
            <Input type="date" value={selectedDate} onChange={(e) => navigate("date", e.target.value)} />
          </div>
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
            {studentsWithAttendance.length === 0 ? (
              <p className="text-sm text-[--muted-foreground]">No students enrolled in this subject from your classes.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithAttendance.map((student) => (
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
                                  : "bg-[--secondary] text-[--muted-foreground] border-transparent hover:bg-slate-200"
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
  );
}
