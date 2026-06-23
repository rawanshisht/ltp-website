"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AssignClassSelectProps {
  studentSubjectId: string;
  currentClassId: string | null;
  classes: { id: string; name: string }[];
}

export function AssignClassSelect({ studentSubjectId, currentClassId, classes }: AssignClassSelectProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(currentClassId ?? "none");

  async function handleChange(newVal: string) {
    setValue(newVal);
    const classId = newVal === "none" ? null : newVal;
    await fetch(`/api/teacher/student-subjects/${studentSubjectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-1.5">
      <Select value={value} onValueChange={handleChange} disabled={pending}>
        <SelectTrigger className="w-36 h-7 text-xs">
          <SelectValue placeholder="Assign…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">— Unassigned —</SelectItem>
          {classes.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && <Loader2 className="h-3 w-3 animate-spin text-(--muted-foreground)" />}
    </div>
  );
}
