"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Subject, Student } from "@prisma/client";

type Incident = {
  id: string;
  date: Date;
  title: string;
  description: string;
  severity: "MINOR" | "MODERATE" | "MAJOR";
  student: Student;
  subject: Subject | null;
};

interface IncidentsTableProps {
  incidents: Incident[];
  students: Student[];
  subjects: Subject[];
}

function severityVariant(s: string) {
  if (s === "MAJOR") return "destructive";
  if (s === "MODERATE") return "warning";
  return "secondary";
}

export function IncidentsTable({ incidents, students, subjects }: IncidentsTableProps) {
  const router = useRouter();

  // Filters
  const [studentFilter, setStudentFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Edit state
  const [editing, setEditing] = useState<Incident | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSeverity, setEditSeverity] = useState<"MINOR" | "MODERATE" | "MAJOR">("MINOR");
  const [editStudent, setEditStudent] = useState("");
  const [editSubject, setEditSubject] = useState("none");
  const [editDate, setEditDate] = useState("");

  function openEdit(inc: Incident) {
    setEditing(inc);
    setEditTitle(inc.title);
    setEditDesc(inc.description);
    setEditSeverity(inc.severity);
    setEditStudent(inc.student.id);
    setEditSubject(inc.subject?.id ?? "none");
    setEditDate(new Date(inc.date).toISOString().split("T")[0]);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    await fetch("/api/teacher/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        studentId: editStudent,
        subjectId: editSubject === "none" ? undefined : editSubject,
        date: editDate,
        title: editTitle,
        description: editDesc,
        severity: editSeverity,
      }),
    });
    setLoading(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch("/api/teacher/incidents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    router.refresh();
  }

  const filtered = incidents.filter((inc) => {
    if (studentFilter.trim() && !inc.student.name.toLowerCase().includes(studentFilter.toLowerCase())) return false;
    if (subjectFilter !== "all" && inc.subject?.id !== subjectFilter) return false;
    if (dateFilter) {
      const incDate = new Date(inc.date).toISOString().split("T")[0];
      if (incDate !== dateFilter) return false;
    }
    return true;
  });

  const hasFilter = studentFilter.trim() || subjectFilter !== "all" || dateFilter;

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          placeholder="Search student name…"
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          className="w-48"
        />

        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-40 h-9"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        {hasFilter && (
          <Button variant="outline" onClick={() => { setStudentFilter(""); setSubjectFilter("all"); setDateFilter(""); }}>
            Clear
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[--muted-foreground]">No incidents{hasFilter ? " matching filter" : ""}.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inc) => (
              <TableRow key={inc.id}>
                <TableCell className="text-[--muted-foreground] whitespace-nowrap">{formatDate(inc.date)}</TableCell>
                <TableCell className="font-medium">{inc.student.name}</TableCell>
                <TableCell>{inc.title}</TableCell>
                <TableCell>{inc.subject?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={severityVariant(inc.severity)}>
                    {inc.severity.charAt(0) + inc.severity.slice(1).toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-[--muted-foreground] text-sm max-w-xs truncate">{inc.description}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(inc)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                      disabled={deleting === inc.id}
                      onClick={() => handleDelete(inc.id)}
                    >
                      {deleting === inc.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Incident</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Student</Label>
                <Select value={editStudent} onValueChange={setEditStudent} required>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Subject (optional)</Label>
                <Select value={editSubject} onValueChange={setEditSubject}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select value={editSeverity} onValueChange={(v) => setEditSeverity(v as typeof editSeverity)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MINOR">Minor</SelectItem>
                    <SelectItem value="MODERATE">Moderate</SelectItem>
                    <SelectItem value="MAJOR">Major</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
