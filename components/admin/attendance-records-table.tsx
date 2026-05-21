"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { Subject, Student } from "@prisma/client";

type AttendanceRecord = {
  id: string;
  sessionDate: Date;
  status: string;
  student: Student;
  subject: Subject;
};

interface AttendanceRecordsTableProps {
  records: AttendanceRecord[];
  subjects: Subject[];
  students: Student[];
}

export function AttendanceRecordsTable({ records, subjects, students }: AttendanceRecordsTableProps) {
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [studentFilter, setStudentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = records.filter((r) => {
    if (subjectFilter !== "all" && r.subject.id !== subjectFilter) return false;
    if (studentFilter !== "all" && r.student.id !== studentFilter) return false;
    if (dateFilter) {
      const d = new Date(r.sessionDate).toISOString().split("T")[0];
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
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((a) => (
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
    </>
  );
}
