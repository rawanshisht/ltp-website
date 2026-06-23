"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Loader2, Trash2, AlertCircle } from "lucide-react";
import type { Subject, Class } from "@prisma/client";

interface Teacher {
  id: string;
  user: { firstName: string; lastName: string; email: string };
  teacherSubjects: { subjectId: string }[];
  teacherClasses: { classId: string }[];
}

interface Props {
  teacher: Teacher;
  subjects: Subject[];
  classes: Class[];
}

export function EditTeacherDialog({ teacher, subjects, classes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState(teacher.user.firstName);
  const [lastName, setLastName] = useState(teacher.user.lastName);
  const [email, setEmail] = useState(teacher.user.email);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    teacher.teacherSubjects.map((ts) => ts.subjectId)
  );
  const [selectedClasses, setSelectedClasses] = useState<string[]>(
    teacher.teacherClasses.map((tc) => tc.classId)
  );

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  function toggleClass(id: string) {
    setSelectedClasses((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }

  function onOpen(v: boolean) {
    setOpen(v);
    if (v) {
      setFirstName(teacher.user.firstName);
      setLastName(teacher.user.lastName);
      setEmail(teacher.user.email);
      setSelectedSubjects(teacher.teacherSubjects.map((ts) => ts.subjectId));
      setSelectedClasses(teacher.teacherClasses.map((tc) => tc.classId));
      setError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, subjectIds: selectedSubjects, classIds: selectedClasses }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Update failed.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Teacher</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Subjects</Label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleSubject(s.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    selectedSubjects.includes(s.id)
                      ? "bg-(--primary) text-[#0f172a] border-(--primary)"
                      : "bg-white border-(--border) text-(--foreground) hover:bg-(--secondary)"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Classes</Label>
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => toggleClass(c.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    selectedClasses.includes(c.id)
                      ? "bg-(--primary) text-[#0f172a] border-(--primary)"
                      : "bg-white border-(--border) text-(--foreground) hover:bg-(--secondary)"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteTeacherButton({ teacherId }: { teacherId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/admin/teachers/${teacherId}`, { method: "DELETE" });
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Delete Teacher</DialogTitle></DialogHeader>
        <p className="text-sm text-(--muted-foreground) mt-2">
          Are you sure you want to delete this teacher? Their account and all associated data will be permanently removed.
        </p>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
