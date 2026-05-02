import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";
import type { SubscriptionRow } from "@/types";

type PlanName = SubscriptionRow["plan"];
type StatusName = SubscriptionRow["status"];

function planFromPriceId(priceId: string): PlanName {
  if (priceId === process.env.STRIPE_PRICE_PRO_ID) return "pro";
  if (priceId === process.env.STRIPE_PRICE_STARTER_ID) return "starter";
  return "free";
}

function mapStatus(status: Stripe.Subscription.Status): StatusName {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    default:
      return "canceled";
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = createAdminClient();

  try {
    switch (event.type) {
      // ── Subscription created or updated ─────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;

        if (!userId) {
          console.warn("No supabase_user_id in subscription metadata:", sub.id);
          break;
        }

        const priceId = sub.items.data[0]?.price.id ?? "";
        const plan = planFromPriceId(priceId);
        const status = mapStatus(sub.status);
        const periodEnd = new Date(
          (sub as unknown as { current_period_end: number }).current_period_end * 1000,
        ).toISOString();

        const { error } = await db.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: sub.customer as string,
            stripe_subscription_id: sub.id,
            plan,
            status,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

        if (error) console.error("Failed to upsert subscription:", error);
        break;
      }

      // ── Subscription canceled ────────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const { error } = await db
          .from("subscriptions")
          .update({
            plan: "free",
            status: "canceled",
            stripe_subscription_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", sub.customer as string);

        if (error) console.error("Failed to cancel subscription:", error);
        break;
      }

      // ── Successful payment → reset monthly audit counter on renewal ──────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        // Only reset on monthly renewal, not the initial charge
        if (
          invoice.billing_reason === "subscription_cycle" ||
          invoice.billing_reason === "subscription_create"
        ) {
          const { error } = await db
            .from("subscriptions")
            .update({
              audits_used_this_month: 0,
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", invoice.customer as string);

          if (error) console.error("Failed to reset audit count:", error);
        }
        break;
      }

      // ── Failed payment → mark past_due ───────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        const { error } = await db
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", invoice.customer as string);

        if (error) console.error("Failed to set past_due status:", error);
        break;
      }

      default:
        // Silently ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
