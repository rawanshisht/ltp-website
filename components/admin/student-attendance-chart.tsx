"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendanceBarChart } from "@/components/charts/enrollment-bar-chart";

interface DataPoint {
  name: string;
  fullName: string;
  pct: number;
}

export function StudentAttendanceChart({ data }: { data: DataPoint[] }) {
  const [selected, setSelected] = useState("all");

  const filtered =
    selected === "all"
      ? data.map(({ name, pct }) => ({ name, pct }))
      : data.filter((d) => d.fullName === selected).map(({ name, pct }) => ({ name, pct }));

  return (
    <div>
      <div className="mb-4">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All students" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All students</SelectItem>
            {data.map((d) => (
              <SelectItem key={d.fullName} value={d.fullName}>{d.fullName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className={selected === "all" ? "max-h-[400px] overflow-y-auto" : undefined}>
        <AttendanceBarChart data={filtered} />
      </div>
    </div>
  );
}
