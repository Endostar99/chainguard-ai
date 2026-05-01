import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
  typescript: true,
});

/** Stripe Price IDs — set these after creating products in your Stripe dashboard */
export const STRIPE_PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER_ID!,
  pro: process.env.STRIPE_PRICE_PRO_ID!,
};
