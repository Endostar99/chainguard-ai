import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAudit } from "@/lib/claude/client";
import { createClient } from "@/lib/supabase/server";
import type { AuditApiResponse, ApiError } from "@/types";
import { PLAN_LIMITS } from "@/types";

const AuditRequestSchema = z.object({
  contractCode: z
    .string()
    .min(10, "Contract code is too short")
    .max(100_000, "Contract code exceeds 100KB limit"),
  contractName: z.string().max(100).optional(),
});

export async function POST(
  request: NextRequest,
): Promise<NextResponse<AuditApiResponse | ApiError>> {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const parsed = AuditRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }
    const { contractCode, contractName } = parsed.data;

    // 2. Get authenticated user (optional for free tier)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 3. Check audit limits
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
            error: `You've used all ${limit} audits for this month on the ${plan} plan. Upgrade to run more audits.`,
            code: "LIMIT_EXCEEDED",
          },
          { status: 429 },
        );
      }
    }

    // 4. Run the AI audit
    const report = await runAudit(contractCode, contractName);

    // 5. Store result in Supabase
    const auditData = {
      user_id: user?.id ?? null,
      contract_name: contractName ?? null,
      contract_code: contractCode,
      report_json: report,
      trust_score: report.trustScore,
    };

    const { data: savedAudit, error: dbError } = await supabase
      .from("audits")
      .insert(auditData)
      .select("id")
      .single();

    if (dbError || !savedAudit) {
      console.error("Failed to save audit:", dbError);
      // Still return the result even if saving failed
    }

    // 6. Increment audit usage counter
    if (user && savedAudit) {
      await supabase.rpc("increment_audit_count", { p_user_id: user.id });
    }

    return NextResponse.json({
      auditId: savedAudit?.id ?? crypto.randomUUID(),
      trustScore: report.trustScore,
      report,
    });
  } catch (error) {
    console.error("Audit API error:", error);
    return NextResponse.json(
      { error: "Failed to run audit. Please try again." },
      { status: 500 },
    );
  }
}
