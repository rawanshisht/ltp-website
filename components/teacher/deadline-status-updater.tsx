"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HandedStatus } from "@prisma/client";

interface DeadlineStatusUpdaterProps {
  markId: string;
  currentStatus: HandedStatus;
}

export function DeadlineStatusUpdater({ markId, currentStatus }: DeadlineStatusUpdaterProps) {
  const router = useRouter();
  const [status, setStatus] = useState<HandedStatus>(currentStatus);

  async function handleChange(value: string) {
    const newStatus = value as HandedStatus;
    setStatus(newStatus);
    await fetch("/api/teacher/deadline-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markId, handedStatus: newStatus }),
    });
    router.refresh();
  }

  return (
    <Select value={status} onValueChange={handleChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PENDING">Pending</SelectItem>
        <SelectItem value="HANDED">Handed</SelectItem>
        <SelectItem value="OVERDUE">Overdue</SelectItem>
      </SelectContent>
    </Select>
  );
}
