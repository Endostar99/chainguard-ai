"use client";

import { useState } from "react";
import type { Vulnerability, Severity } from "@/types";
import { cn } from "@/lib/utils";
import VulnCard from "./VulnCard";

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];
const TABS = ["all", ...SEVERITY_ORDER] as const;
type Tab = (typeof TABS)[number];

const TAB_ACTIVE: Record<Tab, string> = {
  all: "bg-zinc-700/60 text-zinc-100 border-zinc-600",
  critical: "bg-red-500/15 text-red-400 border-red-500/40",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/40",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/40",
  info: "bg-violet-500/15 text-violet-400 border-violet-500/40",
};

interface Props {
  vulns: Vulnerability[];
  severityBreakdown: Record<Severity, number>;
}

export default function VulnList({ vulns, severityBreakdown }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const filtered =
    activeTab === "all" ? vulns : vulns.filter((v) => v.severity === activeTab);

  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-100 mb-4">Vulnerabilities</h2>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {TABS.map((tab) => {
          const count =
            tab === "all" ? vulns.length : (severityBreakdown[tab as Severity] ?? 0);
          if (tab !== "all" && count === 0) return null;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold border transition-colors capitalize",
                isActive
                  ? TAB_ACTIVE[tab]
                  : "text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-600",
              )}
            >
              {tab === "all" ? "All" : tab} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((vuln, i) => (
            <VulnCard
              key={vuln.id}
              vuln={vuln}
              defaultOpen={
                (vuln.severity === "critical" || vuln.severity === "high") && i < 3
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500 py-8 text-center">
          No {activeTab} findings.
        </p>
      )}
    </section>
  );
}
