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

export function StudentBehaviourChart({ data }: { data: DataPoint[] }) {
  const [selected, setSelected] = useState("all");

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
            {data.map((d) => (
              <SelectItem key={d.fullName} value={d.fullName}>{d.fullName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {needsScroll ? (
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
