"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Subject, Assignment, Student, StudentMark } from "@prisma/client";

type StudentWithMark = Student & { marks: StudentMark[] };
type AssignmentWithSubject = Assignment & { subject: Subject };

interface MarksEntryProps {
  subjects: Subject[];
  assignments: AssignmentWithSubject[];
  selectedAssignment: AssignmentWithSubject | null;
  studentsWithMarks: StudentWithMark[];
  teacherId: string;
}

export function MarksEntry({
  subjects,
  assignments,
  selectedAssignment,
  studentsWithMarks,
  teacherId,
}: MarksEntryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [marksMap, setMarksMap] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    studentsWithMarks.forEach((s) => {
      initial[s.id] = s.marks[0]?.marks?.toString() ?? "";
    });
    return initial;
  });
  const [statusMap, setStatusMap] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    studentsWithMarks.forEach((s) => {
      initial[s.id] = s.marks[0]?.handedStatus ?? "PENDING";
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);

  function navigate(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    if (key === "subject") params.delete("assignment");
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleSave() {
    if (!selectedAssignment) return;
    setSaving(true);

    await fetch("/api/teacher/marks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId: selectedAssignment.id,
        marks: studentsWithMarks.map((s) => ({
          studentId: s.id,
          marks: marksMap[s.id] ? parseFloat(marksMap[s.id]) : null,
          handedStatus: statusMap[s.id],
        })),
      }),
    });

    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Select Assignment</CardTitle></CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div className="space-y-1.5 min-w-48">
            <Label>Subject</Label>
            <Select value={searchParams.get("subject") ?? ""} onValueChange={(v) => navigate("subject", v)}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {assignments.length > 0 && (
            <div className="space-y-1.5 min-w-64">
              <Label>Assignment</Label>
              <Select value={searchParams.get("assignment") ?? ""} onValueChange={(v) => navigate("assignment", v)}>
                <SelectTrigger><SelectValue placeholder="Select assignment" /></SelectTrigger>
                <SelectContent>
                  {assignments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title} — {formatDate(a.deadline)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAssignment && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedAssignment.title}</CardTitle>
                <p className="text-sm text-[--muted-foreground] mt-1">
                  {selectedAssignment.subject.name} · Max: {selectedAssignment.maxMarks} marks · Due: {formatDate(selectedAssignment.deadline)}
                </p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Marks
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {studentsWithMarks.length === 0 ? (
              <p className="text-sm text-[--muted-foreground]">No students enrolled in this subject.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Marks (/{selectedAssignment.maxMarks})</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithMarks.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={selectedAssignment.maxMarks}
                          className="w-24"
                          value={marksMap[student.id] ?? ""}
                          onChange={(e) =>
                            setMarksMap((prev) => ({ ...prev, [student.id]: e.target.value }))
                          }
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={statusMap[student.id] ?? "PENDING"}
                          onValueChange={(v) =>
                            setStatusMap((prev) => ({ ...prev, [student.id]: v }))
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="HANDED">Handed</SelectItem>
                            <SelectItem value="OVERDUE">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedAssignment && searchParams.get("subject") && (
        <Card>
          <CardContent className="p-8 text-center text-[--muted-foreground] text-sm">
            Select an assignment to enter marks.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
