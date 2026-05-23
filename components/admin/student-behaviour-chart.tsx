"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BehaviourBarChart } from "@/components/charts/behaviour-bar-chart";

interface DataPoint {
  name: string;
  fullName: string;
  behaviour: number;
  attentive: number;
  engagement: number;
}

interface StudentInfo {
  name: string;
}

export function StudentBehaviourChart({
  data,
  students = [],
}: {
  data: DataPoint[];
  students?: StudentInfo[];
}) {
  const [selected, setSelected] = useState("all");

  // Merge names from records + all active students for a complete dropdown
  const allNames = Array.from(
    new Set([...students.map((s) => s.name), ...data.map((d) => d.fullName)])
  ).sort();

  const filtered =
    selected === "all"
      ? data.map(({ name, behaviour, attentive, engagement }) => ({ name, behaviour, attentive, engagement }))
      : data
          .filter((d) => d.fullName === selected)
          .map(({ name, behaviour, attentive, engagement }) => ({ name, behaviour, attentive, engagement }));

  const needsScroll = selected === "all" && data.length > 8;
  const scrollWidth = Math.max(560, data.length * 80);

  return (
    <div>
      <div className="mb-4">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All students" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All students</SelectItem>
            {allNames.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No records yet for this student.</p>
      ) : needsScroll ? (
        <div className="overflow-x-auto">
          <div style={{ minWidth: scrollWidth }}>
            <BehaviourBarChart data={filtered} />
          </div>
        </div>
      ) : (
        <BehaviourBarChart data={filtered} />
      )}
    </div>
  );
}
