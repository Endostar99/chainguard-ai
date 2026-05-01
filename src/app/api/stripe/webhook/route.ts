import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

// Stripe requires the raw body for webhook signature verification
export const config = {
  api: { bodyParser: false },
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
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

  const supabase = await createClient();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      // TODO: Upsert subscription record in Supabase
      // Map stripe plan to our plan names (free/starter/pro)
      console.warn("Handle subscription update:", subscription.id);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      // TODO: Set subscription status to 'canceled', downgrade to free
      console.warn("Handle subscription deletion:", subscription.id);
      break;
    }

    case "invoice.payment_succeeded": {
      // TODO: Reset monthly audit count at start of new billing period
      break;
    }

    case "invoice.payment_failed": {
      // TODO: Send payment failure email via Supabase Edge Function or Resend
      break;
    }

    default:
      console.warn(`Unhandled Stripe event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
