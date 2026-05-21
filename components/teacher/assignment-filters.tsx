"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Subject } from "@prisma/client";

interface AssignmentFiltersProps {
  subjects: Subject[];
  currentSubjectId: string;
}

export function AssignmentFilters({ subjects, currentSubjectId }: AssignmentFiltersProps) {
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
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All subjects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All subjects</SelectItem>
          {subjects.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentSubjectId && (
        <Button variant="outline" onClick={() => router.push(pathname)}>
          Clear
        </Button>
      )}
    </div>
  );
}
