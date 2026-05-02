"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Severity } from "@/types";

interface Props {
  breakdown: Record<Severity, number>;
}

const SEVERITY_CONFIG: { key: Severity; label: string; color: string }[] = [
  { key: "critical", label: "Critical", color: "#f87171" },
  { key: "high", label: "High", color: "#fb923c" },
  { key: "medium", label: "Medium", color: "#facc15" },
  { key: "low", label: "Low", color: "#60a5fa" },
  { key: "info", label: "Info", color: "#a78bfa" },
];

export default function SeverityChart({ breakdown }: Props) {
  const data = SEVERITY_CONFIG.map(({ key, label, color }) => ({
    name: label,
    count: breakdown[key] ?? 0,
    color,
  }));

  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
      >
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={{ stroke: "#3f3f46" }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={60}
          tick={{ fill: "#a1a1aa", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          contentStyle={{
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: 8,
            color: "#f4f4f5",
            fontSize: 12,
          }}
          formatter={(value: number) => [value, "findings"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
