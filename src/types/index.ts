// ─── Audit Types ─────────────────────────────────────────────────────────────

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  /** Why this matters in plain English */
  impact: string;
  /** Line numbers in the submitted contract */
  affectedLines: number[];
  /** Code snippet showing the vulnerable section */
  vulnerableCode?: string;
  /** Explanation of how to fix it */
  fixSuggestion: string;
  /** Corrected code example */
  fixCode?: string;
  /** OWASP / SWC reference */
  reference?: string;
}

export interface AuditReport {
  /** Plain-English summary for non-technical founders */
  executiveSummary: string;
  /** 0–100 weighted trust score */
  trustScore: number;
  /** Breakdown of findings by severity */
  severityBreakdown: Record<Severity, number>;
  vulnerabilities: Vulnerability[];
  /** ISO timestamp when the audit was run */
  auditedAt: string;
  /** The model used */
  model: string;
}

// ─── Database Row Types (mirrors Supabase schema) ────────────────────────────

export interface AuditRow {
  id: string;
  user_id: string;
  contract_name: string | null;
  contract_code: string;
  report_json: AuditReport;
  trust_score: number;
  created_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: "free" | "starter" | "pro";
  status: "active" | "canceled" | "past_due" | "trialing";
  audits_used_this_month: number;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

// ─── Plan Limits ──────────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<string, { auditsPerMonth: number; price: number }> = {
  free: { auditsPerMonth: 3, price: 0 },
  starter: { auditsPerMonth: 20, price: 49 },
  pro: { auditsPerMonth: 100, price: 199 },
};

// ─── API Response Types ───────────────────────────────────────────────────────

export interface AuditApiResponse {
  auditId: string;
  trustScore: number;
  report: AuditReport;
}

export interface ApiError {
  error: string;
  code?: string;
}
