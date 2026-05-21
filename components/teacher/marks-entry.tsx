"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === null) params.delete(key);
      else params.set(key, val);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleTabChange(tab: string) {
    const params = new URLSearchParams();
    if (tab === "assessment") params.set("mode", "assessment");
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

  const currentSubject = searchParams.get("subject") ?? "";
  const currentAssignment = searchParams.get("assignment") ?? "";

  const selectors = (
    <Card>
      <CardHeader><CardTitle>Select Assignment</CardTitle></CardHeader>
      <CardContent className="flex gap-4 flex-wrap">
        {/* Subject */}
        <div className="space-y-1.5 min-w-48">
          <Label>Subject</Label>
          <Select
            value={currentSubject}
            onValueChange={(v) => navigate({ subject: v, assignment: null })}
          >
            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>
              {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Assignment */}
        {assignments.length > 0 && (
          <div className="space-y-1.5 min-w-64">
            <Label>{isAssessmentMode ? "Assessment" : "Assignment"}</Label>
            <Select
              value={currentAssignment}
              onValueChange={(v) => navigate({ assignment: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${isAssessmentMode ? "assessment" : "assignment"}`} />
              </SelectTrigger>
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

        {currentSubject && assignments.length === 0 && (
          <p className="self-end text-sm text-slate-500 pb-2">
            No {isAssessmentMode ? "assessments" : "homework"} for this subject yet.
          </p>
        )}
      </CardContent>
    </Card>
  );

  const marksTable = selectedAssignment ? (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{selectedAssignment.title}</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              {selectedAssignment.subject.name} · Max: {selectedAssignment.maxMarks} marks
              {isAssessmentMode ? (
                <Badge variant="secondary" className="ml-2">Face-to-face</Badge>
              ) : (
                ` · Due: ${formatDate(selectedAssignment.deadline)}`
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
          <p className="text-sm text-slate-500">No students enrolled in this subject.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Marks (/{selectedAssignment.maxMarks})</TableHead>
                <TableHead>%</TableHead>
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
                    <TableCell className="text-slate-500 text-sm">
                      {pct !== null ? `${pct}%` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  ) : currentSubject && assignments.length > 0 ? (
    <Card>
      <CardContent className="p-8 text-center text-slate-500 text-sm">
        Select {isAssessmentMode ? "an assessment" : "an assignment"} to enter marks.
      </CardContent>
    </Card>
  ) : null;

  return (
    <Tabs value={isAssessmentMode ? "assessment" : "homework"} onValueChange={handleTabChange}>
      <TabsList className="mb-6">
        <TabsTrigger value="homework">Homework</TabsTrigger>
        <TabsTrigger value="assessment">Assessment</TabsTrigger>
      </TabsList>

      <TabsContent value="homework">
        <div className="space-y-6">
          {selectors}
          {marksTable}
        </div>
      </TabsContent>

      <TabsContent value="assessment">
        <div className="space-y-6">
          {selectors}
          {marksTable}
        </div>
      </TabsContent>
    </Tabs>
  );
}
