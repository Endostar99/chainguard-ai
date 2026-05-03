import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAudit } from "@/lib/claude/client";
import { createClient } from "@/lib/supabase/server";
import { calculateTrustScore } from "@/lib/utils";
import type { AuditApiResponse, ApiError } from "@/types";
import { PLAN_LIMITS } from "@/types";

export const maxDuration = 60; // Claude audit can take up to ~30s

const RequestSchema = z.object({
  contractCode: z
    .string()
    .min(10, "Contract code is too short")
    .max(100_000, "Contract code exceeds 100KB limit"),
  contractName: z.string().max(100).optional(),
});

export async function POST(
  request: NextRequest,
): Promise<NextResponse<AuditApiResponse | ApiError>> {
  // 1. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 },
    );
  }
  const { contractCode, contractName } = parsed.data;

  // 2. Get authenticated user (optional — free tier allows anonymous)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Enforce per-plan monthly audit limits for authenticated users
  if (user) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, audits_used_this_month")
      .eq("user_id", user.id)
      .single();

    const plan = subscription?.plan ?? "free";
    const used = subscription?.audits_used_this_month ?? 0;
    const limit = PLAN_LIMITS[plan]?.auditsPerMonth ?? 3;

    if (used >= limit) {
      return NextResponse.json(
        {
          error: `You've used all ${limit} audits this month on the ${plan} plan. Upgrade to run more.`,
          code: "LIMIT_EXCEEDED",
        },
        { status: 429 },
      );
    }
  }

  // 4. Run the AI audit via Claude
  let report;
  try {
    report = await runAudit(contractCode, contractName);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to run audit.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 5. Recalculate trust score server-side so it's always consistent with the
  //    formula (100 - 30×critical - 15×high - 7×medium - 3×low), regardless of
  //    what Claude computed.
  const trustScore = calculateTrustScore(report.severityBreakdown);
  report = { ...report, trustScore };

  // 6. Persist to Supabase
  const { data: savedAudit, error: dbError } = await supabase
    .from("audits")
    .insert({
      user_id: user?.id ?? null,
      contract_name: contractName ?? null,
      contract_code: contractCode,
      report_json: report,
      trust_score: trustScore,
    })
    .select("id")
    .single();

  if (dbError || !savedAudit) {
    console.error("Failed to save audit to Supabase:", dbError?.message);
    return NextResponse.json(
      { error: "Failed to save audit. Please try again." },
      { status: 500 },
    );
  }

  // 7. Increment the user's monthly usage counter
  if (user) {
    const { error: rpcError } = await supabase.rpc("increment_audit_count", {
      p_user_id: user.id,
    });
    if (rpcError) {
      console.error("Failed to increment audit count:", rpcError.message);
    }
  }

  return NextResponse.json({
    auditId: savedAudit.id,
    trustScore,
    report,
  });
}
