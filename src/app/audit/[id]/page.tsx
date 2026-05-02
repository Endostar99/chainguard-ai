import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Cpu, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { AuditRow, Severity } from "@/types";
import { cn, formatDate, severityColor, trustScoreColor } from "@/lib/utils";
import TrustGauge from "@/components/audit/TrustGauge";
import SeverityChart from "@/components/audit/SeverityChart";
import VulnCard from "@/components/audit/VulnCard";
import DownloadPDFButton from "@/components/audit/DownloadPDFButton";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("audits")
    .select("contract_name, trust_score")
    .eq("id", id)
    .single();

  const name = (data as { contract_name: string | null } | null)?.contract_name;
  const score = (data as { trust_score: number } | null)?.trust_score;
  return {
    title: name ? `${name} — Audit Report` : `Audit Report #${id.slice(0, 8)}`,
    description: score != null ? `Trust score: ${score}/100` : undefined,
  };
}

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

export default async function AuditResultPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("audits")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const audit = data as AuditRow;
  const report = audit.report_json;

  const vulns = [...report.vulnerabilities].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

  const totalFindings = Object.values(report.severityBreakdown).reduce(
    (sum, n) => sum + n,
    0,
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {/* Nav bar */}
        <div className="flex items-center justify-between mb-8 no-print">
          <Link
            href="/history"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to history
          </Link>
          <div className="flex items-center gap-2">
            {report.trustScore >= 80 && (
              <Link
                href={`/badge/${id}`}
                className="btn-secondary flex items-center gap-2 text-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share Badge
              </Link>
            )}
            <DownloadPDFButton auditId={id} contractName={audit.contract_name ?? undefined} />
          </div>
        </div>

        {/* Report header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">
            {audit.contract_name ?? "Untitled Contract"}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(audit.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              {report.model}
            </span>
            <span className="font-mono text-xs text-zinc-600">{id}</span>
          </div>
        </div>

        {/* Trust gauge + summary + chart */}
        <div className="grid gap-6 lg:grid-cols-[220px_1fr] mb-8">
          <div className="card flex items-center justify-center py-8">
            <TrustGauge score={report.trustScore} />
          </div>

          <div className="flex flex-col gap-6">
            <div className="card flex-1">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Executive Summary
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {report.executiveSummary}
              </p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Severity Breakdown
                </p>
                <span className="text-xs text-zinc-500">
                  {totalFindings} finding{totalFindings !== 1 ? "s" : ""}
                </span>
              </div>
              {totalFindings === 0 ? (
                <p className="text-sm font-medium text-green-400">
                  No vulnerabilities found
                </p>
              ) : (
                <SeverityChart breakdown={report.severityBreakdown} />
              )}
            </div>
          </div>
        </div>

        {/* Severity pill summary */}
        {totalFindings > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-8">
            {SEVERITY_ORDER.map((sev) => {
              const count = report.severityBreakdown[sev] ?? 0;
              if (count === 0) return null;
              return (
                <span
                  key={sev}
                  className={cn("text-sm font-semibold tabular-nums", severityColor(sev))}
                >
                  {count} {sev}
                </span>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 mb-8 text-xs text-yellow-400/80 leading-relaxed">
          <strong className="font-semibold">Advisory only.</strong> This report is
          AI-generated. High-value contracts should undergo human expert review before
          deployment.
        </div>

        {/* Vulnerability cards */}
        {vulns.length > 0 ? (
          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">
              Vulnerabilities
            </h2>
            <div className="space-y-3">
              {vulns.map((vuln, i) => (
                <VulnCard
                  key={vuln.id}
                  vuln={vuln}
                  defaultOpen={vuln.severity === "critical" || vuln.severity === "high" ? i < 3 : false}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="card text-center py-12">
            <div
              className={cn(
                "text-5xl font-bold mb-3",
                trustScoreColor(report.trustScore),
              )}
            >
              {report.trustScore}
            </div>
            <p className="text-zinc-100 font-semibold text-lg">
              No vulnerabilities detected
            </p>
            <p className="text-sm text-zinc-400 mt-1">
              This contract passed all checks in our audit suite.
            </p>
          </div>
        )}

        {/* Bottom download button */}
        <div className="mt-10 flex justify-end no-print">
          <DownloadPDFButton auditId={id} contractName={audit.contract_name ?? undefined} />
        </div>
      </div>
    </div>
  );
}
