import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { AuditRow, Severity } from "@/types";
import { formatDate } from "@/lib/utils";

// ─── Brand palette ────────────────────────────────────────────────────────────

const C = {
  brand: "#16a34a",
  text: "#111827",
  muted: "#6b7280",
  subtle: "#9ca3af",
  border: "#e5e7eb",
  surface: "#f9fafb",
  white: "#ffffff",
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#d97706",
  low: "#2563eb",
  info: "#7c3aed",
} as const;

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: C.critical,
  high: C.high,
  medium: C.medium,
  low: C.low,
  info: C.info,
};

const SEVERITY_BG: Record<Severity, string> = {
  critical: "#fef2f2",
  high: "#fff7ed",
  medium: "#fffbeb",
  low: "#eff6ff",
  info: "#f5f3ff",
};

function trustColor(score: number) {
  if (score >= 80) return C.brand;
  if (score >= 60) return C.medium;
  if (score >= 40) return C.high;
  return C.critical;
}

function trustLabel(score: number) {
  if (score >= 80) return "Trusted";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Risky";
  return "Critical Risk";
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 52,
    paddingLeft: 48,
    paddingRight: 48,
    backgroundColor: C.white,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: C.text,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
  },
  brandText: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
  },
  brandGreen: {
    color: C.brand,
  },
  headerMeta: {
    alignItems: "flex-end",
  },
  contractName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  metaLine: {
    fontSize: 8,
    color: C.muted,
    marginTop: 2,
    textAlign: "right",
  },

  // Score + summary row
  topRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  scoreBox: {
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
    borderRadius: 8,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 8,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
  },
  scoreNumber: {
    fontSize: 42,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1,
  },
  scoreSubLabel: {
    fontSize: 7.5,
    color: C.muted,
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scoreRating: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  summaryBox: {
    flex: 1,
  },

  // Section labels
  sectionLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: C.muted,
    marginBottom: 5,
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    marginTop: 4,
    color: C.text,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.55,
    color: C.text,
  },

  // Severity breakdown
  breakdownRow: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
    marginBottom: 20,
  },
  breakdownCell: {
    flex: 1,
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 12,
  },
  breakdownCount: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
  },
  breakdownName: {
    fontSize: 7,
    textTransform: "uppercase",
    color: C.muted,
    marginTop: 2,
    letterSpacing: 0.3,
  },

  // Disclaimer
  disclaimer: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderStyle: "solid",
    borderRadius: 6,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 8,
    color: "#92400e",
    lineHeight: 1.45,
  },

  // Vulnerability card
  vulnCard: {
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftStyle: "solid",
    borderRadius: 4,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
  },
  vulnMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  vulnBadge: {
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: 3,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    color: C.white,
  },
  vulnId: {
    fontSize: 8,
    fontFamily: "Courier",
    color: C.muted,
  },
  vulnTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  vulnLines: {
    fontSize: 8,
    color: C.muted,
    fontFamily: "Courier",
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: C.muted,
    marginTop: 7,
    marginBottom: 2,
  },
  fieldText: {
    fontSize: 9.5,
    lineHeight: 1.45,
    color: C.text,
  },
  codeBlock: {
    borderRadius: 4,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 9,
    paddingRight: 9,
    marginTop: 3,
  },
  codeText: {
    fontFamily: "Courier",
    fontSize: 7.5,
    lineHeight: 1.4,
  },
  refLink: {
    fontSize: 8,
    color: C.brand,
    marginTop: 6,
  },

  // Footer (fixed — repeats on every page)
  footer: {
    position: "absolute",
    bottom: 20,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "solid",
    paddingTop: 7,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: C.subtle,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

// ─── Document ─────────────────────────────────────────────────────────────────

interface Props {
  audit: AuditRow;
  contractName: string;
}

export default function AuditPDFDocument({ audit, contractName }: Props) {
  const report = audit.report_json;
  const scoreColor = trustColor(report.trustScore);
  const scoreRating = trustLabel(report.trustScore);
  const totalFindings = Object.values(report.severityBreakdown).reduce(
    (sum, n) => sum + n,
    0,
  );
  const vulns = [...report.vulnerabilities].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
  );

  return (
    <Document
      title={`ChainGuard AI Audit — ${contractName}`}
      author="ChainGuard AI"
      subject="Smart Contract Security Audit Report"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.brandText}>
              Chain<Text style={s.brandGreen}>Guard</Text> AI
            </Text>
            <Text style={[s.metaLine, { marginTop: 3 }]}>
              Smart Contract Security Report
            </Text>
          </View>
          <View style={s.headerMeta}>
            <Text style={s.contractName}>{contractName}</Text>
            <Text style={s.metaLine}>{formatDate(audit.created_at)}</Text>
            <Text style={s.metaLine}>Audited by {report.model}</Text>
          </View>
        </View>

        {/* ── Trust score + executive summary ───────────────────────── */}
        <View style={s.topRow}>
          <View style={s.scoreBox}>
            <Text style={[s.scoreNumber, { color: scoreColor }]}>
              {report.trustScore}
            </Text>
            <Text style={s.scoreSubLabel}>Trust Score</Text>
            <Text style={[s.scoreRating, { color: scoreColor }]}>
              {scoreRating}
            </Text>
          </View>
          <View style={s.summaryBox}>
            <Text style={s.sectionLabel}>Executive Summary</Text>
            <Text style={s.bodyText}>{report.executiveSummary}</Text>
          </View>
        </View>

        {/* ── Severity breakdown ────────────────────────────────────── */}
        <Text style={s.sectionLabel}>
          Severity Breakdown · {totalFindings} finding
          {totalFindings !== 1 ? "s" : ""}
        </Text>
        <View style={s.breakdownRow}>
          {SEVERITY_ORDER.map((sev) => {
            const count = report.severityBreakdown[sev] ?? 0;
            return (
              <View key={sev} style={s.breakdownCell}>
                <Text
                  style={[s.breakdownCount, { color: SEVERITY_COLOR[sev] }]}
                >
                  {count}
                </Text>
                <Text style={s.breakdownName}>{sev}</Text>
              </View>
            );
          })}
        </View>

        {/* ── Disclaimer ────────────────────────────────────────────── */}
        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              Advisory only.{" "}
            </Text>
            This report is AI-generated. High-value contracts should undergo
            human expert review before deployment to mainnet.
          </Text>
        </View>

        {/* ── Vulnerabilities ───────────────────────────────────────── */}
        {vulns.length === 0 ? (
          <View
            style={{
              backgroundColor: "#f0fdf4",
              borderRadius: 8,
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Helvetica-Bold",
                color: C.brand,
              }}
            >
              No vulnerabilities detected
            </Text>
            <Text style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
              This contract passed all checks in the audit suite.
            </Text>
          </View>
        ) : (
          <>
            <Text style={s.sectionHeading}>Vulnerabilities</Text>
            {vulns.map((vuln) => (
              <View
                key={vuln.id}
                style={[
                  s.vulnCard,
                  {
                    borderLeftColor: SEVERITY_COLOR[vuln.severity],
                    backgroundColor: SEVERITY_BG[vuln.severity],
                  },
                ]}
                wrap={false}
              >
                {/* Card header */}
                <View style={s.vulnMeta}>
                  <View
                    style={[
                      s.vulnBadge,
                      { backgroundColor: SEVERITY_COLOR[vuln.severity] },
                    ]}
                  >
                    <Text>{vuln.severity}</Text>
                  </View>
                  <Text style={s.vulnId}>{vuln.id}</Text>
                </View>

                <Text style={s.vulnTitle}>{vuln.title}</Text>

                {vuln.affectedLines.length > 0 && (
                  <Text style={s.vulnLines}>
                    Lines: {vuln.affectedLines.join(", ")}
                  </Text>
                )}

                {/* Description + Impact side by side */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Description</Text>
                    <Text style={s.fieldText}>{vuln.description}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Impact</Text>
                    <Text style={s.fieldText}>{vuln.impact}</Text>
                  </View>
                </View>

                {/* Vulnerable code */}
                {vuln.vulnerableCode && (
                  <>
                    <Text style={[s.fieldLabel, { color: C.critical }]}>
                      Vulnerable Code
                    </Text>
                    <View
                      style={[
                        s.codeBlock,
                        { backgroundColor: "#1f2937" },
                      ]}
                    >
                      <Text style={[s.codeText, { color: "#fca5a5" }]}>
                        {vuln.vulnerableCode}
                      </Text>
                    </View>
                  </>
                )}

                {/* Fix suggestion */}
                <Text style={s.fieldLabel}>Fix Suggestion</Text>
                <Text style={s.fieldText}>{vuln.fixSuggestion}</Text>

                {/* Fixed code */}
                {vuln.fixCode && (
                  <>
                    <Text style={[s.fieldLabel, { color: C.brand }]}>
                      Fixed Code
                    </Text>
                    <View
                      style={[
                        s.codeBlock,
                        { backgroundColor: "#052e16" },
                      ]}
                    >
                      <Text style={[s.codeText, { color: "#86efac" }]}>
                        {vuln.fixCode}
                      </Text>
                    </View>
                  </>
                )}

                {/* SWC reference */}
                {vuln.reference && (
                  <Text style={s.refLink}>Reference: {vuln.reference}</Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* ── Footer (repeats on every page) ────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Chain<Text style={{ color: C.brand }}>Guard</Text> AI · Confidential
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
