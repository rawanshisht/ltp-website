"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, FileText, AlertCircle } from "lucide-react";
import type { Subject, Class } from "@prisma/client";

const CLASS_LABELS: Record<string, string> = {
  YOUNGER_BOYS: "Younger Boys",
  OLDER_BOYS: "Older Boys",
  GIRLS: "Girls",
};

interface UploadMaterialDialogProps {
  subjects: Subject[];
  classes: Class[];
  teacherId: string;
}

export function UploadMaterialDialog({ subjects, classes, teacherId }: UploadMaterialDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  function toggleClass(classId: string) {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subjectId", subjectId);
    formData.append("teacherId", teacherId);
    selectedClassIds.forEach((id) => formData.append("classIds", id));
    if (file) formData.append("file", file);

    const res = await fetch("/api/teacher/materials", { method: "POST", body: formData });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    setTitle("");
    setSubjectId("");
    setSelectedClassIds([]);
    setFile(null);
    setError("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setError(""); }}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" />Upload Material</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload Class Material</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Chapter 5 Notes" />
          </div>
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId} required>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Classes (leave all unchecked for all classes)</Label>
            <div className="flex flex-col gap-2">
              {classes.map((c) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                    checked={selectedClassIds.includes(c.id)}
                    onChange={() => toggleClass(c.id)}
                  />
                  <span className="text-sm">{CLASS_LABELS[c.name] ?? c.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>File (optional)</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <p className="flex items-center gap-1.5 text-xs text-slate-600">
                <FileText className="h-3.5 w-3.5" />
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !subjectId || !title}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {file ? "Upload & Save" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
