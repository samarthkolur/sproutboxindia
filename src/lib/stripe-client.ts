import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripeClient() {
  const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
  if (!publicKey) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(publicKey);
  }
  return stripePromise;
}
