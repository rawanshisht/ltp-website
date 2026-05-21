"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Subject } from "@prisma/client";

interface MaterialFiltersProps {
  subjects: Subject[];
  currentSubjectId: string;
}

export function MaterialFilters({ subjects, currentSubjectId }: MaterialFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(subjectId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (subjectId) params.set("subject", subjectId);
    else params.delete("subject");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Select
        value={currentSubjectId || "all"}
        onValueChange={(v) => navigate(v === "all" ? null : v)}
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
        <Button variant="outline" onClick={() => navigate(null)}>Clear</Button>
      )}
    </div>
  );
}
