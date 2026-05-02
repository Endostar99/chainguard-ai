import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import type { AuditRow } from "@/types";

export const runtime = "edge";
export const alt = "ChainGuard AI Trust Certificate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function trustLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Trusted";
  return "Moderate";
}

function scoreColor(score: number) {
  if (score >= 80) return "#4ade80";
  if (score >= 60) return "#facc15";
  return "#fb923c";
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId } = await params;

  // Use anon client directly — no cookies needed, RLS allows public badge access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data } = await supabase
    .from("audits")
    .select("contract_name, trust_score, report_json, created_at")
    .eq("id", auditId)
    .single();

  const audit = data as Pick<
    AuditRow,
    "contract_name" | "trust_score" | "report_json" | "created_at"
  > | null;

  const score = audit?.trust_score ?? 0;
  const contractName =
    audit?.contract_name ?? `Contract-${auditId.slice(0, 8).toUpperCase()}`;
  const color = scoreColor(score);
  const label = trustLabel(score);
  const date = audit
    ? new Date(audit.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const breakdown = audit?.report_json?.severityBreakdown;
  const SEVERITY_ORDER = ["critical", "high", "medium", "low", "info"] as const;
  const SEVERITY_COLOR: Record<string, string> = {
    critical: "#f87171",
    high: "#fb923c",
    medium: "#fbbf24",
    low: "#60a5fa",
    info: "#a78bfa",
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Green glow background */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(34,197,94,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(34,197,94,0.15)",
              border: "1.5px solid rgba(34,197,94,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            ✓
          </div>
          <span style={{ fontSize: "22px", color: "#71717a", letterSpacing: "3px", textTransform: "uppercase" }}>
            Chain<span style={{ color: "#4ade80" }}>Guard</span> AI
          </span>
        </div>

        {/* Certificate card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background: "#0d1f12",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: "20px",
            padding: "40px 60px",
            minWidth: "700px",
          }}
        >
          <div style={{ fontSize: "13px", color: "#4ade8099", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "12px", display: "flex" }}>
            Security Certificate
          </div>

          <div style={{ fontSize: "36px", fontWeight: "700", color: "#f4f4f5", marginBottom: "8px", display: "flex" }}>
            {contractName}
          </div>

          <div style={{ fontSize: "14px", color: "#71717a", marginBottom: "32px", display: "flex" }}>
            Independently verified by ChainGuard AI
          </div>

          {/* Score */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
            <span style={{ fontSize: "96px", fontWeight: "800", color, lineHeight: 1, display: "flex" }}>
              {score}
            </span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "16px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "2px" }}>
                Trust
              </span>
              <span style={{ fontSize: "16px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "2px" }}>
                Score
              </span>
            </div>
          </div>
          <div style={{ fontSize: "18px", fontWeight: "700", color, marginBottom: "28px", display: "flex" }}>
            {label}
          </div>

          {/* Severity row */}
          {breakdown && (
            <div style={{ display: "flex", gap: "16px" }}>
              {SEVERITY_ORDER.map((sev) => {
                const count = breakdown[sev] ?? 0;
                return (
                  <div
                    key={sev}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      background: "#111827",
                      border: "1px solid #1f2937",
                      borderRadius: "10px",
                      padding: "10px 18px",
                      minWidth: "64px",
                    }}
                  >
                    <span style={{ fontSize: "24px", fontWeight: "700", color: SEVERITY_COLOR[sev], display: "flex" }}>
                      {count}
                    </span>
                    <span style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "1px", display: "flex" }}>
                      {sev}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer date */}
        {date && (
          <div style={{ marginTop: "24px", fontSize: "13px", color: "#52525b", display: "flex" }}>
            Audited on {date}
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
