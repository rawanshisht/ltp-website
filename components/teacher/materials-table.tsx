"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fileDownloadUrl } from "@/lib/file-utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Loader2, FileText, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Subject, Class } from "@prisma/client";

const CLASS_LABELS: Record<string, string> = {
  YOUNGER_BOYS: "Younger Boys",
  OLDER_BOYS: "Older Boys",
  GIRLS: "Girls",
};

type Material = {
  id: string;
  title: string;
  fileUrl: string | null;
  createdAt: Date;
  subject: Subject;
  class: Class | null;
};

interface MaterialsTableProps {
  materials: Material[];
  subjects: Subject[];
  classes: Class[];
}

export function MaterialsTable({ materials, subjects, classes }: MaterialsTableProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [editClassId, setEditClassId] = useState("");

  function openEdit(m: Material) {
    setEditing(m);
    setEditTitle(m.title);
    setEditSubjectId(m.subject.id);
    setEditClassId(m.class?.id ?? "");
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    await fetch("/api/teacher/materials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        title: editTitle,
        subjectId: editSubjectId,
        classId: editClassId || undefined,
      }),
    });
    setLoading(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch("/api/teacher/materials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    router.refresh();
  }

  if (materials.length === 0) {
    return <p className="text-sm text-(--muted-foreground)">No materials uploaded yet.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>File</TableHead>
            <TableHead className="w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-(--muted-foreground)" />
                  <span className="font-medium">{m.title}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{m.subject.name}</Badge>
              </TableCell>
              <TableCell>
                {m.class ? (
                  <Badge variant="outline">{CLASS_LABELS[m.class.name] ?? m.class.name}</Badge>
                ) : (
                  <span className="text-xs text-(--muted-foreground)">All classes</span>
                )}
              </TableCell>
              <TableCell className="text-(--muted-foreground)">{formatDate(m.createdAt)}</TableCell>
              <TableCell>
                {m.fileUrl ? (
                  <a
                    href={fileDownloadUrl(m.fileUrl)}
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
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(m)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                    disabled={deleting === m.id}
                    onClick={() => handleDelete(m.id)}
                  >
                    {deleting === m.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Material</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={editSubjectId} onValueChange={setEditSubjectId} required>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Class (optional)</Label>
              <Select value={editClassId || "all"} onValueChange={(v) => setEditClassId(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{CLASS_LABELS[c.name] ?? c.name}</SelectItem>)}
                </SelectContent>
              </Select>
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
