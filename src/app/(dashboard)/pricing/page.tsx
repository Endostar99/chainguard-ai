import type { Metadata } from "next";
import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/types";
import type { SubscriptionRow } from "@/types";
import CheckoutButton from "@/components/billing/CheckoutButton";
import ManageSubscriptionButton from "@/components/billing/ManageSubscriptionButton";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing" };

// ─── Plan definitions ─────────────────────────────────────────────────────────

interface PlanConfig {
  id: "free" | "starter" | "pro";
  name: string;
  price: number;
  description: string;
  features: string[];
  highlighted: boolean;
}

const PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Try ChainGuard AI with no commitment.",
    features: [
      "3 audits per month",
      "Trust score (0–100)",
      "Severity breakdown",
      "Fix suggestions",
      "PDF export",
    ],
    highlighted: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: PLAN_LIMITS.starter.price,
    description: "For indie devs and early-stage projects.",
    features: [
      "20 audits per month",
      "Everything in Free",
      "Trust badge (score ≥ 80)",
      "Shareable report links",
      "Email support",
    ],
    highlighted: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: PLAN_LIMITS.pro.price,
    description: "For teams shipping to mainnet.",
    features: [
      "100 audits per month",
      "Everything in Starter",
      "Priority audit queue",
      "Bulk contract upload",
      "Priority support",
    ],
    highlighted: false,
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { upgraded } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan: SubscriptionRow["plan"] = "free";
  let auditsUsed = 0;
  let isOnPaidPlan = false;

  if (user) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status, audits_used_this_month")
      .eq("user_id", user.id)
      .single();

    const activeSub = sub as Pick<
      SubscriptionRow,
      "plan" | "status" | "audits_used_this_month"
    > | null;

    if (
      activeSub &&
      (activeSub.status === "active" || activeSub.status === "trialing")
    ) {
      currentPlan = activeSub.plan;
      auditsUsed = activeSub.audits_used_this_month;
      isOnPaidPlan = activeSub.plan !== "free";
    }
  }

  const priceIds = {
    starter: process.env.STRIPE_PRICE_STARTER_ID ?? "",
    pro: process.env.STRIPE_PRICE_PRO_ID ?? "",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Upgrade success banner */}
      {upgraded && (
        <div className="mb-8 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm text-green-400">
          <strong className="font-semibold">You&apos;re upgraded!</strong> Your
          new plan is active. It may take a moment for your audit limit to
          refresh.
        </div>
      )}

      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-zinc-100 sm:text-4xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-3 text-zinc-400">
          Cancel or change plans any time. No lock-in.
        </p>

        {user && (
          <p className="mt-2 text-sm text-zinc-500">
            Current plan:{" "}
            <span className="font-semibold text-zinc-300 capitalize">
              {currentPlan}
            </span>
            {" · "}
            {auditsUsed} /{" "}
            {PLAN_LIMITS[currentPlan]?.auditsPerMonth ?? 3} audits used this
            month
          </p>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = user && currentPlan === plan.id;
          const priceId = priceIds[plan.id as "starter" | "pro"];
          const planRank = { free: 0, starter: 1, pro: 2 } as const;
          const isUpgrade =
            user && planRank[plan.id] > planRank[currentPlan];

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-colors",
                plan.highlighted
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-zinc-800 bg-zinc-900/50",
                isCurrent && "ring-2 ring-green-500/30",
              )}
            >
              {/* Most popular badge */}
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-0.5 text-xs font-semibold text-black">
                    <Zap className="h-3 w-3" />
                    Most popular
                  </span>
                </div>
              )}

              {/* Plan name + price */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-zinc-100">{plan.name}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-zinc-100">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-zinc-400">/month</span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{plan.description}</p>
              </div>

              {/* Feature list */}
              <ul className="mb-8 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                    <span className="text-sm text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <PlanCTA
                plan={plan}
                isCurrent={!!isCurrent}
                isUpgrade={!!isUpgrade}
                isLoggedIn={!!user}
                isOnPaidPlan={isOnPaidPlan}
                priceId={priceId}
              />
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="mt-10 text-center text-xs text-zinc-500">
        Payments processed securely by Stripe. Cancel any time from your
        billing portal.
      </p>
    </div>
  );
}

// ─── CTA helper (avoids repeating logic inline) ───────────────────────────────

function PlanCTA({
  plan,
  isCurrent,
  isUpgrade,
  isLoggedIn,
  isOnPaidPlan,
  priceId,
}: {
  plan: PlanConfig;
  isCurrent: boolean;
  isUpgrade: boolean;
  isLoggedIn: boolean;
  isOnPaidPlan: boolean;
  priceId: string;
}) {
  // Current plan
  if (isCurrent) {
    return (
      <div className="space-y-2">
        <div className="w-full rounded-lg border border-green-500/30 bg-green-500/10 py-2 text-center text-sm font-semibold text-green-400">
          Current plan
        </div>
        {isOnPaidPlan && <ManageSubscriptionButton />}
      </div>
    );
  }

  // Free plan — no checkout needed
  if (plan.id === "free") {
    if (!isLoggedIn) {
      return (
        <Link href="/signup" className="btn-secondary w-full text-center block">
          Get started free
        </Link>
      );
    }
    // Logged in and on paid plan — can downgrade via portal
    if (isOnPaidPlan) {
      return <ManageSubscriptionButton />;
    }
    // Logged in and already on free (handled by isCurrent above)
    return null;
  }

  // Paid plan — not logged in
  if (!isLoggedIn) {
    return (
      <Link
        href={`/signup?next=/pricing`}
        className="btn-primary w-full text-center block"
      >
        Get started
      </Link>
    );
  }

  // Paid plan — logged in and this is an upgrade
  if (isUpgrade && priceId) {
    return (
      <CheckoutButton
        priceId={priceId}
        className={plan.highlighted ? "btn-primary w-full" : "btn-secondary w-full"}
      >
        Upgrade to {plan.name}
      </CheckoutButton>
    );
  }

  // Paid plan — logged in but this plan is lower than current (downgrade)
  return <ManageSubscriptionButton />;
}
