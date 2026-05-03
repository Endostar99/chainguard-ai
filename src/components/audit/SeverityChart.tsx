"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";
import type { Severity } from "@/types";

interface Props {
  breakdown: Record<Severity, number>;
}

const SEVERITY_CONFIG: { key: Severity; label: string; color: string }[] = [
  { key: "critical", label: "Critical", color: "#f87171" },
  { key: "high",     label: "High",     color: "#fb923c" },
  { key: "medium",   label: "Medium",   color: "#facc15" },
  { key: "low",      label: "Low",      color: "#60a5fa" },
  { key: "info",     label: "Info",     color: "#a78bfa" },
];

// Left column: Critical, High, Medium — Right column: Low, Info
const LEFT_COL  = SEVERITY_CONFIG.slice(0, 3);
const RIGHT_COL = SEVERITY_CONFIG.slice(3);

export default function SeverityChart({ breakdown }: Props) {
  const pieData = SEVERITY_CONFIG
    .map(({ key, label, color }) => ({ name: label, value: breakdown[key] ?? 0, color }))
    .filter((d) => d.value > 0);

  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex items-center gap-6 flex-wrap">
      {/* Donut ring */}
      <div className="relative shrink-0 w-[148px] h-[148px]">
        <PieChart width={148} height={148}>
          <Pie
            data={pieData}
            cx={74}
            cy={74}
            innerRadius={50}
            outerRadius={70}
            paddingAngle={pieData.length > 1 ? 2 : 0}
            dataKey="value"
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: 8,
              color: "#f4f4f5",
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [value, name]}
          />
        </PieChart>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-zinc-100 leading-none tabular-nums">
            {total}
          </span>
          <span className="text-[10px] text-zinc-500 text-center leading-tight mt-1">
            Total<br />Vulnerabilities
          </span>
        </div>
      </div>

      {/* Legend — 2 columns */}
      <div className="flex gap-8">
        <div className="flex flex-col gap-3">
          {LEFT_COL.map(({ key, label, color }) => (
            <LegendItem key={key} label={label} color={color} count={breakdown[key] ?? 0} />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {RIGHT_COL.map(({ key, label, color }) => (
            <LegendItem key={key} label={label} color={color} count={breakdown[key] ?? 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LegendItem({ label, color, count }: { label: string; color: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[3px] h-5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <div>
        <div className="text-[11px] text-zinc-500 leading-none mb-0.5">{label}</div>
        <div className="text-base font-bold text-zinc-100 tabular-nums leading-none">
          {String(count).padStart(2, "0")}
        </div>
      </div>
    </div>
  );
}
