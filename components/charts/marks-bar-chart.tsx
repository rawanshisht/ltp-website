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

export interface MarksDataPoint {
  subject: string;
  avg: number;
}

export function MarksBarChart({ data }: { data: MarksDataPoint[] }) {
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
        <YAxis type="category" dataKey="subject" width={120} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => [`${v}%`, "Average"]} />
        <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.subject}
              fill={entry.avg >= 70 ? "#22c55e" : entry.avg >= 50 ? "#f59e0b" : "#ef4444"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
