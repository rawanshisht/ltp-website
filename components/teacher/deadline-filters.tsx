"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Subject } from "@prisma/client";

interface DeadlineFiltersProps {
  subjects: Subject[];
  currentSubjectId: string;
  currentStatus: string;
}

export function DeadlineFilters({ subjects, currentSubjectId, currentStatus }: DeadlineFiltersProps) {
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

      <Select
        value={currentStatus || "pending"}
        onValueChange={(v) => navigate({ status: v === "pending" ? null : v })}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending / Overdue</SelectItem>
          <SelectItem value="handed">All handed</SelectItem>
          <SelectItem value="all">All</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={() => router.push(pathname)}
      >
        Clear
      </Button>
    </div>
  );
}
