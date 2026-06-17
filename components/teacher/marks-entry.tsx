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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Save, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Subject, Assignment, Student, StudentMark, Class } from "@prisma/client";

const CLASS_LABELS: Record<string, string> = {
  YOUNGER_BOYS: "Younger Boys",
  OLDER_BOYS: "Older Boys",
  GIRLS: "Girls",
};

type StudentWithMark = Student & { marks: StudentMark[] };
type AssignmentWithSubject = Assignment & { subject: Subject };

interface MarksEntryProps {
  subjects: Subject[];
  classes: Class[];
  assignments: AssignmentWithSubject[];
  selectedAssignment: AssignmentWithSubject | null;
  studentsWithMarks: StudentWithMark[];
  teacherId: string;
  isAssessmentMode: boolean;
}

export function MarksEntry({
  subjects,
  classes,
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
  const [editing, setEditing] = useState<{ studentId: string; name: string; savedMark: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  async function handleEditSave() {
    if (!editing || !selectedAssignment) return;
    setEditSaving(true);
    const parsed = editValue !== "" ? parseFloat(editValue) : null;
    await fetch("/api/teacher/marks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: editing.studentId, assignmentId: selectedAssignment.id, marks: parsed }),
    });
    setMarksMap((prev) => ({ ...prev, [editing.studentId]: editValue }));
    setEditSaving(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(studentId: string) {
    if (!selectedAssignment) return;
    setDeleting(studentId);
    await fetch("/api/teacher/marks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, assignmentId: selectedAssignment.id }),
    });
    setMarksMap((prev) => ({ ...prev, [studentId]: "" }));
    setDeleting(null);
    router.refresh();
  }

  const currentSubject = searchParams.get("subject") ?? "";
  const currentClass = searchParams.get("class") ?? "";
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
            onValueChange={(v) => navigate({ subject: v, class: null, assignment: null })}
          >
            <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
            <SelectContent>
              {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Class */}
        {currentSubject && (
          <div className="space-y-1.5 min-w-44">
            <Label>Class</Label>
            <Select
              value={currentClass || "all"}
              onValueChange={(v) => navigate({ class: v === "all" ? null : v, assignment: null })}
            >
              <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{CLASS_LABELS[c.name] ?? c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
            No {isAssessmentMode ? "assessments" : "homework"} for this subject{currentClass ? " and class" : ""} yet.
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
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Marks (/{selectedAssignment.maxMarks})</TableHead>
                <TableHead>%</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsWithMarks.map((student) => {
                const val = marksMap[student.id] ?? "";
                const pct = val && selectedAssignment.maxMarks
                  ? Math.round((parseFloat(val) / selectedAssignment.maxMarks) * 100)
                  : null;
                const savedMark = student.marks[0]?.marks?.toString() ?? "";
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
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit saved mark"
                          onClick={() => { setEditing({ studentId: student.id, name: student.name, savedMark }); setEditValue(savedMark); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Clear mark"
                          disabled={deleting === student.id || !savedMark}
                          onClick={() => handleDelete(student.id)}
                        >
                          {deleting === student.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4 text-red-500" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Edit dialog */}
          <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Mark — {editing?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <Label>Marks (out of {selectedAssignment.maxMarks})</Label>
                <Input
                  type="number"
                  min="0"
                  max={selectedAssignment.maxMarks}
                  step="0.5"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter mark"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={handleEditSave} disabled={editSaving}>
                  {editSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </>
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
