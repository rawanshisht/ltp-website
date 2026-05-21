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
  isAssessmentMode: boolean;
}

export function MarksEntry({
  subjects,
  assignments,
  selectedAssignment,
  studentsWithMarks,
  teacherId,
  isAssessmentMode,
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
        isAssessment: isAssessmentMode,
        marks: studentsWithMarks.map((s) => ({
          studentId: s.id,
          marks: marksMap[s.id] ? parseFloat(marksMap[s.id]) : null,
        })),
      }),
    });

    setSaving(false);
    router.refresh();
  }

  const modeParam = isAssessmentMode ? "?mode=assessment" : "";
  const subjectParam = searchParams.get("subject");

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div className="flex gap-2 border-b border-[--border] pb-1">
        <a
          href={`/teacher/marks${subjectParam ? `?subject=${subjectParam}` : ""}`}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${!isAssessmentMode ? "bg-[--primary] text-white" : "text-[--muted-foreground] hover:text-[--foreground]"}`}
        >
          Homework
        </a>
        <a
          href={`/teacher/marks?mode=assessment${subjectParam ? `&subject=${subjectParam}` : ""}`}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${isAssessmentMode ? "bg-[--primary] text-white" : "text-[--muted-foreground] hover:text-[--foreground]"}`}
        >
          Assessments
        </a>
      </div>

      <Card>
        <CardHeader><CardTitle>Select {isAssessmentMode ? "Assessment" : "Assignment"}</CardTitle></CardHeader>
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
              <Label>{isAssessmentMode ? "Assessment" : "Assignment"}</Label>
              <Select value={searchParams.get("assignment") ?? ""} onValueChange={(v) => navigate("assignment", v)}>
                <SelectTrigger><SelectValue placeholder={`Select ${isAssessmentMode ? "assessment" : "assignment"}`} /></SelectTrigger>
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
                  {selectedAssignment.subject.name} · Max: {selectedAssignment.maxMarks} marks
                  {!isAssessmentMode && ` · Due: ${formatDate(selectedAssignment.deadline)}`}
                  {isAssessmentMode && (
                    <Badge variant="secondary" className="ml-2">Face-to-face</Badge>
                  )}
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
                    {!isAssessmentMode && <TableHead>%</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithMarks.map((student) => {
                    const val = marksMap[student.id] ?? "";
                    const pct = val && selectedAssignment.maxMarks
                      ? Math.round((parseFloat(val) / selectedAssignment.maxMarks) * 100)
                      : null;
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={selectedAssignment.maxMarks}
                            step="0.5"
                            className="w-24"
                            value={val}
                            onChange={(e) =>
                              setMarksMap((prev) => ({ ...prev, [student.id]: e.target.value }))
                            }
                            placeholder="—"
                          />
                        </TableCell>
                        {!isAssessmentMode && (
                          <TableCell className="text-[--muted-foreground] text-sm">
                            {pct !== null ? `${pct}%` : "—"}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedAssignment && searchParams.get("subject") && (
        <Card>
          <CardContent className="p-8 text-center text-[--muted-foreground] text-sm">
            Select {isAssessmentMode ? "an assessment" : "an assignment"} to enter marks.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
