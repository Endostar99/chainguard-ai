import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

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

  // 2. Get the user's Stripe customer ID
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  const customerId = (sub as { stripe_customer_id: string | null } | null)
    ?.stripe_customer_id;

  if (!customerId) {
    return NextResponse.json(
      { error: "No billing account found. Please subscribe first." },
      { status: 404 },
    );
  }

  // 3. Create portal session
  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/history`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to open billing portal.";
    console.error("[stripe/portal]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
