"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import type { Subject, Class, Parent } from "@prisma/client";

type ParentWithUser = Parent & { user: { id: string; firstName: string; lastName: string; email: string } };

interface AddStudentDialogProps {
  subjects: Subject[];
  classes: Class[];
  parents: ParentWithUser[];
}

const classLabel = (name: string) =>
  name === "YOUNGER_BOYS" ? "Younger Boys" : name === "OLDER_BOYS" ? "Older Boys" : "Girls";

export function AddStudentDialog({ subjects, classes, parents }: AddStudentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parentTab, setParentTab] = useState<"existing" | "new">("existing");

  // Student fields
  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Existing parent
  const [parentId, setParentId] = useState("");

  // New parent fields
  const [npFirstName, setNpFirstName] = useState("");
  const [npLastName, setNpLastName] = useState("");
  const [npEmail, setNpEmail] = useState("");
  const [npPassword, setNpPassword] = useState("");
  const [npPhone, setNpPhone] = useState("");

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function reset() {
    setName(""); setClassId(""); setSelectedSubjects([]);
    setParentId(""); setParentTab("existing");
    setNpFirstName(""); setNpLastName(""); setNpEmail(""); setNpPassword(""); setNpPhone("");
    setError("");
  }

  const hasParent =
    (parentTab === "existing" && parentId !== "") ||
    (parentTab === "new" &&
      npFirstName.trim() !== "" &&
      npLastName.trim() !== "" &&
      npEmail.trim() !== "" &&
      npPassword.trim() !== "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasParent) {
      setError("A parent or guardian is required.");
      return;
    }
    setLoading(true);
    setError("");

    const body: Record<string, unknown> = { name, classId, subjectIds: selectedSubjects };
    if (parentTab === "existing" && parentId) {
      body.parentId = parentId;
    } else if (parentTab === "new" && npEmail) {
      body.newParent = {
        firstName: npFirstName,
        lastName: npLastName,
        email: npEmail,
        password: npPassword,
        phone: npPhone,
      };
    }

    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to add student.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" />Add Student</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Student info */}
          <div className="space-y-1.5">
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Student name" />
          </div>
          <div className="space-y-1.5">
            <Label>Class <span className="text-red-500">*</span></Label>
            <Select value={classId} onValueChange={setClassId} required>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{classLabel(c.name)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Parent section */}
          <div className="space-y-2">
            <Label>
              Parent / Guardian <span className="text-red-500">*</span>
            </Label>
            <Tabs value={parentTab} onValueChange={(v) => setParentTab(v as "existing" | "new")}>
              <TabsList className="h-8">
                <TabsTrigger value="existing" className="text-xs px-3 py-1">Select existing</TabsTrigger>
                <TabsTrigger value="new" className="text-xs px-3 py-1">Create new</TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="mt-2">
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger><SelectValue placeholder="Select a parent" /></SelectTrigger>
                  <SelectContent>
                    {parents.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.user.firstName} {p.user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>

              <TabsContent value="new" className="mt-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">First Name <span className="text-red-500">*</span></Label>
                    <Input value={npFirstName} onChange={(e) => setNpFirstName(e.target.value)} placeholder="First name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Last Name <span className="text-red-500">*</span></Label>
                    <Input value={npLastName} onChange={(e) => setNpLastName(e.target.value)} placeholder="Last name" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email <span className="text-red-500">*</span></Label>
                  <Input type="email" value={npEmail} onChange={(e) => setNpEmail(e.target.value)} placeholder="parent@example.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Password <span className="text-red-500">*</span></Label>
                    <Input type="password" value={npPassword} onChange={(e) => setNpPassword(e.target.value)} placeholder="Temporary password" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone (optional)</Label>
                    <Input value={npPhone} onChange={(e) => setNpPhone(e.target.value)} placeholder="+44..." />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Subject enrollment */}
          <div className="space-y-1.5">
            <Label>Enroll in Subjects</Label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleSubject(s.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    selectedSubjects.includes(s.id)
                      ? "bg-[#00dcde] text-[#0f172a] border-[#00dcde]"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {s.name}
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
            <Button type="submit" disabled={loading || !classId || !name || !hasParent}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
