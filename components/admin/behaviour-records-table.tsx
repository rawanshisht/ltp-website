"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { Subject, Student } from "@prisma/client";

type BehaviourRecord = {
  id: string;
  lessonDate: Date;
  behaviourStars: number;
  attentiveStars: number;
  engagementStars: number;
  note: string | null;
  student: Student;
  subject: Subject;
  teacher: { user: { firstName: string; lastName: string } };
};

function starDisplay(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

interface BehaviourRecordsTableProps {
  records: BehaviourRecord[];
  subjects: Subject[];
  students: Student[];
}

export function BehaviourRecordsTable({ records, subjects, students }: BehaviourRecordsTableProps) {
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = records.filter((r) => {
    if (subjectFilter !== "all" && r.subject.id !== subjectFilter) return false;
    if (studentFilter !== "all" && r.student.id !== studentFilter) return false;
    if (dateFilter) {
      const d = new Date(r.lessonDate).toISOString().split("T")[0];
      if (d !== dateFilter) return false;
    }
    return true;
  });

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={studentFilter} onValueChange={setStudentFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All students" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All students</SelectItem>
            {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-40 h-9"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[--muted-foreground] py-4">No records match the current filter.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Behaviour</TableHead>
              <TableHead>Attentive</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.student.name}</TableCell>
                <TableCell>{b.subject.name}</TableCell>
                <TableCell className="text-[--muted-foreground]">{formatDate(b.lessonDate)}</TableCell>
                <TableCell><span className="text-amber-400 text-sm">{starDisplay(b.behaviourStars)}</span></TableCell>
                <TableCell><span className="text-amber-400 text-sm">{starDisplay(b.attentiveStars)}</span></TableCell>
                <TableCell><span className="text-amber-400 text-sm">{starDisplay(b.engagementStars)}</span></TableCell>
                <TableCell className="text-[--muted-foreground]">{b.teacher.user.firstName} {b.teacher.user.lastName}</TableCell>
                <TableCell className="text-[--muted-foreground] italic">{b.note ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
