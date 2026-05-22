"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface SubmissionCheckerProps {
  markId: string;
  isHandedIn: boolean;
  isOverdue: boolean;
}

export function SubmissionChecker({ markId, isHandedIn, isOverdue }: SubmissionCheckerProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(isHandedIn);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const newVal = !checked;
    setChecked(newVal);
    setLoading(true);
    await fetch("/api/teacher/deadline-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        markId,
        handedStatus: newVal ? "HANDED" : isOverdue ? "OVERDUE" : "PENDING",
      }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-[--muted-foreground]" />
      ) : (
        <input
          type="checkbox"
          checked={checked}
          onChange={toggle}
          className="h-4 w-4 rounded accent-cyan-600 cursor-pointer"
        />
      )}
      <span className={`text-sm ${checked ? "text-green-600 font-medium" : isOverdue ? "text-red-500" : "text-[--muted-foreground]"}`}>
        {checked ? "Handed in" : isOverdue ? "Overdue" : "Pending"}
      </span>
    </label>
  );
}
