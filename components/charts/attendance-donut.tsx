"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = { Present: "#00dcde", Absent: "#ef4444", Late: "#ff9752" };

export function AttendanceDonut({
  present,
  absent,
  late,
}: {
  present: number;
  absent: number;
  late: number;
}) {
  const data = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
    { name: "Late", value: late },
  ].filter((d) => d.value > 0);

  if (data.length === 0)
    return <p className="text-sm text-(--muted-foreground) text-center py-8">No attendance data yet.</p>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} sessions`]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
