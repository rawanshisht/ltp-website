"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, Loader2, AlertCircle } from "lucide-react";
import type { Subject, Class, Parent } from "@prisma/client";

type ParentWithUser = Parent & {
  user: { id: string; firstName: string; lastName: string; email: string; phone: string | null };
};

interface StudentForEdit {
  id: string;
  name: string;
  classId: string;
  isActive: boolean;
  studentSubjects: { subjectId: string }[];
  parentStudents: { parent: { id: string } }[];
}

interface EditStudentDialogProps {
  student: StudentForEdit;
  subjects: Subject[];
  classes: Class[];
  parents: ParentWithUser[];
}

const classLabel = (name: string) =>
  name === "YOUNGER_BOYS" ? "Younger Boys" : name === "OLDER_BOYS" ? "Older Boys" : "Girls";

function getParentState(student: StudentForEdit, parents: ParentWithUser[]) {
  const pid = student.parentStudents[0]?.parent.id ?? "none";
  const pp = pid !== "none" ? parents.find((p) => p.id === pid) : undefined;
  return {
    parentId: pid,
    epFirstName: pp?.user.firstName ?? "",
    epLastName: pp?.user.lastName ?? "",
    epEmail: pp?.user.email ?? "",
    epPhone: pp?.user.phone ?? "",
  };
}

export function EditStudentDialog({ student, subjects, classes, parents }: EditStudentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(student.name);
  const [classId, setClassId] = useState(student.classId);
  const [isActive, setIsActive] = useState(student.isActive);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    student.studentSubjects.map((ss) => ss.subjectId)
  );

  // Parent section
  const [parentTab, setParentTab] = useState<"existing" | "new">("existing");
  const [parentId, setParentId] = useState(() => getParentState(student, parents).parentId);
  const [epFirstName, setEpFirstName] = useState(() => getParentState(student, parents).epFirstName);
  const [epLastName, setEpLastName] = useState(() => getParentState(student, parents).epLastName);
  const [epEmail, setEpEmail] = useState(() => getParentState(student, parents).epEmail);
  const [epPhone, setEpPhone] = useState(() => getParentState(student, parents).epPhone);

  // New parent fields
  const [npFirstName, setNpFirstName] = useState("");
  const [npLastName, setNpLastName] = useState("");
  const [npEmail, setNpEmail] = useState("");
  const [npPassword, setNpPassword] = useState("");
  const [npPhone, setNpPhone] = useState("");

  function syncFromProps() {
    const ps = getParentState(student, parents);
    setName(student.name);
    setClassId(student.classId);
    setIsActive(student.isActive);
    setSelectedSubjects(student.studentSubjects.map((ss) => ss.subjectId));
    setParentTab("existing");
    setParentId(ps.parentId);
    setEpFirstName(ps.epFirstName);
    setEpLastName(ps.epLastName);
    setEpEmail(ps.epEmail);
    setEpPhone(ps.epPhone);
    setNpFirstName(""); setNpLastName(""); setNpEmail(""); setNpPassword(""); setNpPhone("");
    setError("");
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v) syncFromProps();
  }

  function handleParentChange(newId: string) {
    setParentId(newId);
    const p = newId !== "none" ? parents.find((p) => p.id === newId) : undefined;
    setEpFirstName(p?.user.firstName ?? "");
    setEpLastName(p?.user.lastName ?? "");
    setEpEmail(p?.user.email ?? "");
    setEpPhone(p?.user.phone ?? "");
  }

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const body: Record<string, unknown> = {
      name,
      classId,
      isActive,
      subjectIds: selectedSubjects,
    };

    if (parentTab === "existing") {
      body.parentId = parentId;
      if (parentId !== "none") {
        body.parentDetails = {
          firstName: epFirstName,
          lastName: epLastName,
          email: epEmail,
          phone: epPhone,
        };
      }
    } else {
      body.newParent = {
        firstName: npFirstName,
        lastName: npLastName,
        email: npEmail,
        password: npPassword,
        phone: npPhone,
      };
    }

    const res = await fetch(`/api/admin/students/${student.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to update student.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mt-2 max-h-[65vh] overflow-y-auto pr-1">

            <div className="space-y-1.5">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Student name" />
            </div>

            <div className="space-y-1.5">
              <Label>Class <span className="text-red-500">*</span></Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{classLabel(c.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parent section */}
            <div className="space-y-2">
              <Label>Parent / Guardian</Label>
              <Tabs value={parentTab} onValueChange={(v) => setParentTab(v as "existing" | "new")}>
                <TabsList className="h-8">
                  <TabsTrigger value="existing" className="text-xs px-3 py-1">Select existing</TabsTrigger>
                  <TabsTrigger value="new" className="text-xs px-3 py-1">Create new</TabsTrigger>
                </TabsList>

                <TabsContent value="existing" className="mt-2 space-y-2">
                  <Select value={parentId} onValueChange={handleParentChange}>
                    <SelectTrigger><SelectValue placeholder="No parent linked" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {parents.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.user.firstName} {p.user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {parentId !== "none" && (
                    <div className="space-y-3 pl-3 border-l-2 border-slate-100 pt-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Edit parent details
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">First Name</Label>
                          <Input value={epFirstName} onChange={(e) => setEpFirstName(e.target.value)} placeholder="First name" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Last Name</Label>
                          <Input value={epLastName} onChange={(e) => setEpLastName(e.target.value)} placeholder="Last name" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Email</Label>
                        <Input type="email" value={epEmail} onChange={(e) => setEpEmail(e.target.value)} placeholder="parent@example.com" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Phone (optional)</Label>
                        <Input value={epPhone} onChange={(e) => setEpPhone(e.target.value)} placeholder="+44..." />
                      </div>
                    </div>
                  )}
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
                        ? "bg-[#00dcde] text-[#0f172a] border-[#00dcde]"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status <span className="text-red-500">*</span></Label>
              <Select value={isActive ? "active" : "inactive"} onValueChange={(v) => setIsActive(v === "active")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !classId || !name}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
