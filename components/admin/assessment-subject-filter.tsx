"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Subject } from "@prisma/client";

interface AssessmentSubjectFilterProps {
  subjects: Subject[];
  currentSubjectId: string;
}

export function AssessmentSubjectFilter({ subjects, currentSubjectId }: AssessmentSubjectFilterProps) {
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
    <div className="mb-6">
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
    </div>
  );
}
