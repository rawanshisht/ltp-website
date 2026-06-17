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
import { Pencil, Trash2, Loader2, FileText, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Class } from "@prisma/client";

const CLASS_LABELS: Record<string, string> = {
  YOUNGER_BOYS: "Younger Boys",
  OLDER_BOYS: "Older Boys",
  GIRLS: "Girls",
};

type Report = {
  id: string;
  title: string;
  notes: string | null;
  fileUrl: string | null;
  createdAt: Date;
  student: { id: string; name: string; class: Class | null };
};

interface ReportsTableProps {
  reports: Report[];
  classes: Class[];
}

export function ReportsTable({ reports, classes }: ReportsTableProps) {
  const router = useRouter();
  const [classFilter, setClassFilter] = useState("all");
  const [editing, setEditing] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");

  function openEdit(r: Report) {
    setEditing(r);
    setEditTitle(r.title);
    setEditNotes(r.notes ?? "");
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    await fetch("/api/teacher/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, title: editTitle, notes: editNotes || undefined }),
    });
    setLoading(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch("/api/teacher/reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    router.refresh();
  }

  const filtered = classFilter === "all"
    ? reports
    : reports.filter((r) => r.student.class?.id === classFilter);

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{CLASS_LABELS[c.name] ?? c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {classFilter !== "all" && (
          <Button variant="outline" onClick={() => setClassFilter("all")}>Clear</Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-(--muted-foreground)">No reports{classFilter !== "all" ? " for this class" : ""} uploaded yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>File</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-(--muted-foreground)" />
                    <span className="font-medium">{r.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{r.student.name}</Badge>
                </TableCell>
                <TableCell>
                  {r.student.class ? (
                    <Badge variant="outline">{CLASS_LABELS[r.student.class.name] ?? r.student.class.name}</Badge>
                  ) : (
                    <span className="text-xs text-(--muted-foreground)">—</span>
                  )}
                </TableCell>
                <TableCell className="text-(--muted-foreground) max-w-xs truncate">
                  {r.notes ?? "—"}
                </TableCell>
                <TableCell className="text-(--muted-foreground) whitespace-nowrap">
                  {formatDate(r.createdAt)}
                </TableCell>
                <TableCell>
                  {r.fileUrl ? (
                    <a
                      href={r.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-cyan-700 hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  ) : (
                    <span className="text-xs text-(--muted-foreground)">No file</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                      disabled={deleting === r.id}
                      onClick={() => handleDelete(r.id)}
                    >
                      {deleting === r.id
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

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Report</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Additional comments for the parent..."
              />
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
