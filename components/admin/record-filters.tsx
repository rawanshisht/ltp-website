"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Subject, Student, Class } from "@prisma/client";

interface RecordFiltersProps {
  subjects: Subject[];
  students: Student[];
  classes?: Class[];
  clearHref: string;
  currentSubjectId: string;
  currentStudentId: string;
  currentDate: string;
  currentClassId?: string;
  showClass?: boolean;
}

export function RecordFilters({
  subjects, students, classes = [],
  clearHref,
  currentSubjectId, currentStudentId, currentDate, currentClassId = "",
  showClass = false,
}: RecordFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === "") params.delete(key);
      else params.set(key, val);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Select
        value={currentSubjectId || "all"}
        onValueChange={(v) => navigate({ subject: v === "all" ? null : v })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All subjects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All subjects</SelectItem>
          {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select
        value={currentStudentId || "all"}
        onValueChange={(v) => navigate({ student: v === "all" ? null : v })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All students" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All students</SelectItem>
          {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {showClass && (
        <Select
          value={currentClassId || "all"}
          onValueChange={(v) => navigate({ class: v === "all" ? null : v })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      <Input
        type="date"
        className="w-40 h-9"
        value={currentDate}
        onChange={(e) => navigate({ date: e.target.value || null })}
      />

      {(currentSubjectId || currentStudentId || currentDate || currentClassId) && (
        <Button variant="outline" onClick={() => router.push(clearHref)}>Clear</Button>
      )}
    </div>
  );
}
