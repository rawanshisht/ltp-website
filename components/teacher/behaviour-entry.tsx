"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";
import type { Subject, Student, Behaviour } from "@prisma/client";

type StudentWithBehaviour = Student & { behaviours: Behaviour[] };

interface BehaviourEntryProps {
  subjects: Subject[];
  studentsWithBehaviour: StudentWithBehaviour[];
  teacherId: string;
  selectedSubjectId: string;
  selectedDate: string;
}

export function BehaviourEntry({
  subjects,
  studentsWithBehaviour,
  teacherId,
  selectedSubjectId,
  selectedDate,
}: BehaviourEntryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [scoreMap, setScoreMap] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    studentsWithBehaviour.forEach((s) => {
      initial[s.id] = s.behaviours[0]?.score?.toString() ?? "3";
    });
    return initial;
  });
  const [noteMap, setNoteMap] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    studentsWithBehaviour.forEach((s) => {
      initial[s.id] = s.behaviours[0]?.note ?? "";
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
    await fetch("/api/teacher/behaviour", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: selectedSubjectId,
        teacherId,
        date: selectedDate,
        records: studentsWithBehaviour.map((s) => ({
          studentId: s.id,
          score: parseInt(scoreMap[s.id] ?? "3"),
          note: noteMap[s.id] || null,
        })),
      }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Select Class & Date</CardTitle></CardHeader>
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
            <Label>Lesson Date</Label>
            <Input type="date" value={selectedDate} onChange={(e) => navigate("date", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {selectedSubjectId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Behaviour Records</CardTitle>
              <Button onClick={handleSave} disabled={saving || studentsWithBehaviour.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {studentsWithBehaviour.length === 0 ? (
              <p className="text-sm text-[--muted-foreground]">No students enrolled in this subject from your classes.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Score (1–5)</TableHead>
                    <TableHead>Note (visible to parent)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithBehaviour.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <Select
                          value={scoreMap[student.id] ?? "3"}
                          onValueChange={(v) => setScoreMap((prev) => ({ ...prev, [student.id]: v }))}
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          rows={1}
                          className="min-h-0 resize-none"
                          value={noteMap[student.id] ?? ""}
                          onChange={(e) => setNoteMap((prev) => ({ ...prev, [student.id]: e.target.value }))}
                          placeholder="Optional note..."
                        />
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
