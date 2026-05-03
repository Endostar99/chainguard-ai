import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

/** Stripe Price IDs — set these after creating products in your Stripe dashboard */
export const STRIPE_PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER_ID!,
  pro: process.env.STRIPE_PRICE_PRO_ID!,
};
