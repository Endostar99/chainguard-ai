import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Severity } from "@/types";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Map a severity level to a Tailwind color class */
export function severityColor(severity: Severity): string {
  const map: Record<Severity, string> = {
    critical: "text-red-500",
    high: "text-orange-500",
    medium: "text-yellow-500",
    low: "text-blue-400",
    info: "text-violet-400",
  };
  return map[severity];
}

/** Map a severity level to a background badge class */
export function severityBadge(severity: Severity): string {
  const map: Record<Severity, string> = {
    critical: "bg-red-500/10 text-red-400 border border-red-500/20",
    high: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    low: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    info: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  };
  return map[severity];
}

/** Get trust score color based on value */
export function trustScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

/** Format a date string to a readable format */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Truncate a Solidity contract for display */
export function truncateContract(code: string, maxLines = 5): string {
  const lines = code.split("\n");
  if (lines.length <= maxLines) return code;
  return lines.slice(0, maxLines).join("\n") + `\n// ... (${lines.length - maxLines} more lines)`;
}

/** Calculate trust score from vulnerabilities */
export function calculateTrustScore(breakdown: Record<Severity, number>): number {
  const weights: Record<Severity, number> = {
    critical: 30,
    high: 15,
    medium: 7,
    low: 3,
    info: 0,
  };

  const totalDeduction = Object.entries(breakdown).reduce((sum, [severity, count]) => {
    return sum + weights[severity as Severity] * count;
  }, 0);

  return Math.max(0, Math.min(100, 100 - totalDeduction));
}
