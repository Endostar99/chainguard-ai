"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { Vulnerability, Severity } from "@/types";
import { cn, severityBadge } from "@/lib/utils";

interface Props {
  vuln: Vulnerability;
  defaultOpen?: boolean;
}

function getReferenceUrl(ref: string): string | null {
  if (/^SWC-\d+$/.test(ref)) {
    return `https://github.com/SmartContractSecurity/SWC-registry/blob/master/docs/${ref}/README.md`;
  }
  if (/^OWASP(-SC-\d+)?$/.test(ref)) {
    return "https://owasp.org/www-project-smart-contract-top-10/";
  }
  if (/^ERC-(\d+)$/.test(ref)) {
    return `https://eips.ethereum.org/EIPS/eip-${ref.slice(4)}`;
  }
  if (/^EIP-(\d+)$/.test(ref)) {
    return `https://eips.ethereum.org/EIPS/eip-${ref.slice(4)}`;
  }
  return null;
}

const BORDER_ACCENT: Record<Severity, string> = {
  critical: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-blue-400",
  info: "border-l-violet-400",
};

export default function VulnCard({ vuln, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800 bg-zinc-900/50 border-l-4 overflow-hidden",
        BORDER_ACCENT[vuln.severity],
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase shrink-0 mt-0.5",
            severityBadge(vuln.severity),
          )}
        >
          {vuln.severity}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-zinc-500">{vuln.id}</span>
            <span className="text-sm font-semibold text-zinc-100">{vuln.title}</span>
          </div>
          {vuln.affectedLines.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {vuln.affectedLines.map((line) => (
                <span
                  key={line}
                  className="text-xs font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded"
                >
                  L{line}
                </span>
              ))}
            </div>
          )}
        </div>

        {open ? (
          <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-5 border-t border-zinc-800 space-y-4">
          <div className="pt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Description
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">{vuln.description}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Impact
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">{vuln.impact}</p>
            </div>
          </div>

          {vuln.vulnerableCode && (
            <div>
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1.5">
                Vulnerable Code
              </p>
              <pre className="text-xs font-mono bg-red-950/30 border border-red-500/20 rounded-lg p-3 overflow-x-auto text-zinc-300 whitespace-pre-wrap">
                <code>{vuln.vulnerableCode}</code>
              </pre>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Fix Suggestion
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed">{vuln.fixSuggestion}</p>
          </div>

          {vuln.fixCode && (
            <div>
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1.5">
                Fixed Code
              </p>
              <pre className="text-xs font-mono bg-green-950/30 border border-green-500/20 rounded-lg p-3 overflow-x-auto text-zinc-300 whitespace-pre-wrap">
                <code>{vuln.fixCode}</code>
              </pre>
            </div>
          )}

          {vuln.reference && (() => {
            const url = getReferenceUrl(vuln.reference);
            return url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {vuln.reference}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                {vuln.reference}
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}
