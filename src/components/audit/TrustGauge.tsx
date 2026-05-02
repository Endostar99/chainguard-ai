"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

interface Props {
  score: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#4ade80";
  if (score >= 60) return "#facc15";
  if (score >= 40) return "#fb923c";
  return "#f87171";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Trusted";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Risky";
  return "Critical Risk";
}

export default function TrustGauge({ score }: Props) {
  const color = scoreColor(score);
  const data = [{ value: score, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[200px] h-[200px]">
        <RadialBarChart
          width={200}
          height={200}
          cx={100}
          cy={100}
          innerRadius={60}
          outerRadius={85}
          startAngle={210}
          endAngle={-30}
          data={data}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: "#27272a" }}
            dataKey="value"
            cornerRadius={8}
            angleAxisId={0}
          />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-5xl font-bold tabular-nums leading-none"
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-xs text-zinc-400 mt-2 font-medium">
            {scoreLabel(score)}
          </span>
        </div>
      </div>
      <p className="text-sm text-zinc-500 -mt-1">Trust Score</p>
    </div>
  );
}
