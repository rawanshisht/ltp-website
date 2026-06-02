"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

export interface AssessmentDataPoint {
  label: string;
  pct: number;
}

export function AssessmentBarChart({ data }: { data: AssessmentDataPoint[] }) {
  if (!data.length) return null;

  const height = Math.max(180, data.length * 44);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 12 }}
        />
        <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [`${v}%`, "Score"]} />
        <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.label}
              fill={entry.pct >= 70 ? "#00dcde" : entry.pct >= 50 ? "#ff9752" : "#ef4444"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
