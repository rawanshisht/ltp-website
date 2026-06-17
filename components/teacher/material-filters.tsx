"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Subject, Class } from "@prisma/client";

const CLASS_LABELS: Record<string, string> = {
  YOUNGER_BOYS: "Younger Boys",
  OLDER_BOYS: "Older Boys",
  GIRLS: "Girls",
};

interface MaterialFiltersProps {
  subjects: Subject[];
  classes: Class[];
  currentSubjectId: string;
  currentClassId: string;
}

export function MaterialFilters({ subjects, classes, currentSubjectId, currentClassId }: MaterialFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilter = currentSubjectId || currentClassId;

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

      <Select
        value={currentClassId || "all"}
        onValueChange={(v) => navigate({ class: v === "all" ? null : v })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All classes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All classes</SelectItem>
          {classes.map((c) => (
            <SelectItem key={c.id} value={c.id}>{CLASS_LABELS[c.name] ?? c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilter && (
        <Button variant="outline" onClick={() => navigate({ subject: null, class: null })}>Clear</Button>
      )}
    </div>
  );
}
