import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileCode2, LogOut, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/(auth)/actions";
import { PLAN_LIMITS } from "@/types";
import type { SubscriptionRow } from "@/types";
import { cn, formatDate, trustScoreColor } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

const PLAN_LABEL: Record<SubscriptionRow["plan"], string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};

const PLAN_COLOR: Record<SubscriptionRow["plan"], string> = {
  free: "text-zinc-400 bg-zinc-800 border-zinc-700",
  starter: "text-green-400 bg-green-500/10 border-green-500/30",
  pro: "text-violet-400 bg-violet-500/10 border-violet-500/30",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Subscription
  const { data: subData } = await supabase
    .from("subscriptions")
    .select("plan, status, audits_used_this_month, current_period_end")
    .eq("user_id", user!.id)
    .single();

  const sub = subData as Pick<
    SubscriptionRow,
    "plan" | "status" | "audits_used_this_month" | "current_period_end"
  > | null;

  const isActiveSub =
    sub && (sub.status === "active" || sub.status === "trialing");
  const plan: SubscriptionRow["plan"] =
    isActiveSub ? sub.plan : "free";
  const auditsUsed = isActiveSub ? sub.audits_used_this_month : 0;
  const auditsLimit = PLAN_LIMITS[plan]?.auditsPerMonth ?? 3;
  const usagePct = Math.min(100, Math.round((auditsUsed / auditsLimit) * 100));
  const resetDate =
    sub?.current_period_end
      ? new Date(sub.current_period_end).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

  // Audit stats
  const { data: auditStats } = await supabase
    .from("audits")
    .select("trust_score, created_at, id, contract_name")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const allAudits = auditStats ?? [];
  const totalAudits = allAudits.length;
  const avgScore =
    totalAudits > 0
      ? Math.round(
          allAudits.reduce((sum, a) => sum + a.trust_score, 0) / totalAudits,
        )
      : null;
  const trustedCount = allAudits.filter((a) => a.trust_score >= 80).length;
  const cleanCount = allAudits.filter((a) => a.trust_score === 100).length;
  const recentAudits = allAudits.slice(0, 3);

  // Initials avatar
  const email = user!.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const memberSince = new Date(user!.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">

      {/* Nav */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/history"
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to history
        </Link>
        <form action={signout}>
          <button
            type="submit"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>

      {/* Account */}
      <div className="card mb-4 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-lg font-bold select-none">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-100">{email}</p>
          <p className="text-sm text-zinc-500">Member since {memberSince}</p>
        </div>
      </div>

      {/* Plan + usage */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-300">Current plan</span>
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                PLAN_COLOR[plan],
              )}
            >
              {PLAN_LABEL[plan]}
            </span>
          </div>
          {plan !== "pro" && (
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:text-green-300 transition-colors"
            >
              <Zap className="h-3 w-3" />
              Upgrade
            </Link>
          )}
        </div>

        {/* Usage bar */}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-zinc-400">Audits this month</span>
          <span className="tabular-nums font-semibold text-zinc-200">
            {auditsUsed}
            <span className="font-normal text-zinc-500"> / {auditsLimit}</span>
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              usagePct >= 90
                ? "bg-red-500"
                : usagePct >= 70
                  ? "bg-yellow-500"
                  : "bg-green-500",
            )}
            style={{ width: `${usagePct}%` }}
          />
        </div>
        {resetDate && (
          <p className="mt-2 text-xs text-zinc-500">Resets {resetDate}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total audits", value: totalAudits },
          {
            label: "Avg trust score",
            value: avgScore !== null ? avgScore : "—",
            color:
              avgScore !== null ? trustScoreColor(avgScore) : "text-zinc-400",
          },
          { label: "Trusted contracts", value: trustedCount, color: "text-green-400" },
          { label: "Perfect score", value: cleanCount, color: "text-green-400" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="card flex flex-col items-center py-4 text-center p-4"
          >
            <span className={cn("text-3xl font-bold tabular-nums", color ?? "text-zinc-100")}>
              {value}
            </span>
            <span className="mt-1 text-xs text-zinc-500 leading-tight">{label}</span>
          </div>
        ))}
      </div>

      {/* Recent audits */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300">Recent audits</h2>
          <Link
            href="/history"
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentAudits.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <FileCode2 className="h-8 w-8 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">No audits yet</p>
            <Link href="/audit" className="btn-primary mt-4 text-sm">
              Run your first audit
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentAudits.map((audit) => (
              <Link
                key={audit.id}
                href={`/audit/${audit.id}`}
                className="group flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <FileCode2 className="h-4 w-4 shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-zinc-300">
                    {audit.contract_name ?? "Untitled Contract"}
                  </p>
                  <p className="text-xs text-zinc-600">{formatDate(audit.created_at)}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-bold tabular-nums",
                    trustScoreColor(audit.trust_score),
                  )}
                >
                  {audit.trust_score}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
