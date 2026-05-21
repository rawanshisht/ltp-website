"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Student } from "@prisma/client";

interface IncidentFiltersProps {
  students: Student[];
  currentStudentId: string;
  currentSeverity: string;
}

export function IncidentFilters({ students, currentStudentId, currentSeverity }: IncidentFiltersProps) {
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

      <Select
        value={currentSeverity || "all"}
        onValueChange={(v) => navigate({ severity: v === "all" ? null : v })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All severities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All severities</SelectItem>
          <SelectItem value="MINOR">Minor</SelectItem>
          <SelectItem value="MODERATE">Moderate</SelectItem>
          <SelectItem value="MAJOR">Major</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
