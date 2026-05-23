"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface BehaviourDataPoint {
  name: string;
  behaviour: number;
  attentive: number;
  engagement: number;
}

export function BehaviourBarChart({ data }: { data: BehaviourDataPoint[] }) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => (typeof v === "number" ? v.toFixed(1) : v)} />
        <Legend />
        <Bar dataKey="behaviour" name="Behaviour" fill="#00dcde" radius={[3, 3, 0, 0]} />
        <Bar dataKey="attentive" name="Attentive" fill="#10b981" radius={[3, 3, 0, 0]} />
        <Bar dataKey="engagement" name="Engagement" fill="#f59e0b" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
