import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ExternalLink, Calendar, Cpu } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { AuditRow, Severity } from "@/types";
import { cn, formatDate, severityColor } from "@/lib/utils";
import CopyLinkButton from "@/components/badge/CopyLinkButton";

interface Props {
  params: Promise<{ auditId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { auditId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("audits")
    .select("contract_name, trust_score")
    .eq("id", auditId)
    .single();

  const name = (data as { contract_name: string | null } | null)?.contract_name;
  const score = (data as { trust_score: number } | null)?.trust_score;

  return {
    title: name
      ? `${name} — ChainGuard Trust Certificate`
      : "ChainGuard Trust Certificate",
    description:
      score != null
        ? `This smart contract scored ${score}/100 on ChainGuard AI's security audit.`
        : "Verified smart contract security certificate by ChainGuard AI.",
    openGraph: {
      images: [`/badge/${auditId}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`/badge/${auditId}/opengraph-image`],
    },
  };
}

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

function TrustRating(score: number) {
  if (score >= 90) return { label: "Excellent", color: "text-green-400" };
  if (score >= 80) return { label: "Trusted", color: "text-green-400" };
  return { label: "Moderate", color: "text-yellow-400" };
}

export default async function BadgePage({ params }: Props) {
  const { auditId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("audits")
    .select("*")
    .eq("id", auditId)
    .single();

  if (!data) notFound();

  const audit = data as AuditRow;

  // Only show badge for trusted contracts (RLS also enforces this, but guard in UI too)
  if (audit.trust_score < 80) notFound();

  const report = audit.report_json;
  const contractName = audit.contract_name ?? `Contract-${auditId.slice(0, 8).toUpperCase()}`;
  const { label: ratingLabel, color: ratingColor } = TrustRating(audit.trust_score);
  const totalFindings = Object.values(report.severityBreakdown).reduce(
    (sum, n) => sum + n,
    0,
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">

      {/* Badge certificate card */}
      <div className="w-full max-w-lg">

        {/* Brand header */}
        <div className="text-center mb-6">
          <span className="text-sm font-semibold tracking-widest text-zinc-500 uppercase">
            Chain<span className="text-green-400">Guard</span> AI
          </span>
        </div>

        {/* Certificate card */}
        <div className="relative rounded-2xl border border-green-500/30 bg-[#0d1f12] p-8 shadow-[0_0_60px_rgba(34,197,94,0.08)]">

          {/* Verified shield */}
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30">
              <ShieldCheck className="h-10 w-10 text-green-400" strokeWidth={1.5} />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <p className="text-xs font-semibold tracking-widest text-green-500/70 uppercase mb-2">
              Security Certificate
            </p>
            <h1 className="text-2xl font-bold text-zinc-100 mb-1">
              {contractName}
            </h1>
            <p className="text-sm text-zinc-500">
              This smart contract has been independently verified by ChainGuard AI
            </p>
          </div>

          {/* Trust score */}
          <div className="flex justify-center mb-6">
            <div className="text-center bg-[#0a0a0a] rounded-xl px-8 py-4 border border-zinc-800">
              <div className={cn("text-6xl font-bold tabular-nums", ratingColor)}>
                {audit.trust_score}
              </div>
              <div className="text-xs font-semibold tracking-widest text-zinc-500 uppercase mt-1">
                Trust Score
              </div>
              <div className={cn("text-sm font-semibold mt-1", ratingColor)}>
                {ratingLabel}
              </div>
            </div>
          </div>

          {/* Severity breakdown */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {SEVERITY_ORDER.map((sev) => {
              const count = report.severityBreakdown[sev] ?? 0;
              return (
                <div
                  key={sev}
                  className="flex flex-col items-center bg-[#0a0a0a] rounded-lg py-3 border border-zinc-800"
                >
                  <span className={cn("text-lg font-bold tabular-nums", severityColor(sev))}>
                    {count}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase mt-0.5">
                    {SEVERITY_LABEL[sev]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Clean bill notice */}
          {totalFindings === 0 && (
            <div className="text-center mb-6 rounded-lg bg-green-500/5 border border-green-500/20 py-3">
              <p className="text-sm font-semibold text-green-400">
                No vulnerabilities detected
              </p>
            </div>
          )}

          {/* Meta */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {formatDate(audit.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3" />
              {report.model}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-800 mb-6" />

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/audit/${auditId}`}
              className="btn-secondary flex flex-1 items-center justify-center gap-2 text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              View Full Report
            </Link>
            <CopyLinkButton className="flex-1" />
            <Link
              href="/audit"
              className="btn-primary flex flex-1 items-center justify-center text-sm"
            >
              Audit Your Contract
            </Link>
          </div>
        </div>

        {/* Footer disclaimer */}
        <p className="text-center text-xs text-zinc-600 mt-6 leading-relaxed">
          This certificate is issued by ChainGuard AI and is advisory only.
          <br />
          High-value contracts should undergo human expert review before deployment.
        </p>
      </div>
    </div>
  );
}
