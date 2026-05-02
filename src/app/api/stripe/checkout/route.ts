import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

const VALID_PRICE_IDS = new Set([
  process.env.STRIPE_PRICE_STARTER_ID,
  process.env.STRIPE_PRICE_PRO_ID,
]);

export async function POST(request: NextRequest) {
  // 1. Require auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  // 2. Validate price ID
  let priceId: string;
  try {
    ({ priceId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!priceId || !VALID_PRICE_IDS.has(priceId)) {
    return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
  }

  // 3. Get or create Stripe customer, storing user_id in metadata
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = (sub as { stripe_customer_id: string | null } | null)
    ?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  // 4. Create checkout session
  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/history?upgraded=true`,
    cancel_url: `${origin}/pricing`,
    allow_promotion_codes: true,
    subscription_data: {
      // Stored on the subscription so the webhook can find the user
      metadata: { supabase_user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
