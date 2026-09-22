export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-3S2T96R14P";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function pageview(url: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
}

type GtagEventParams = Record<string, string | number | boolean | undefined>;

export function event(name: string, params?: GtagEventParams) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}

// Maps to the assignment's Acquisition KPI category (Active Certified
// Growers / restaurant partner count) — fired once a registration
// actually completes, not on form start.
export function trackSignUp(method: "grower" | "restaurant", params?: GtagEventParams) {
  event("sign_up", { method, ...params });
}

// Maps to the assignment's Revenue/MRR KPI category — GA4's recommended
// ecommerce event so it shows up in built-in Monetization reports.
export function trackPurchase(params: {
  transactionId: string;
  value: number;
  cropType: string;
  quantityKg: number;
}) {
  event("purchase", {
    currency: "INR",
    transaction_id: params.transactionId,
    value: params.value,
    item_name: params.cropType,
    quantity: params.quantityKg,
  });
}

// Maps to the assignment's Engagement KPI category (grower activity
// feeding Grower Acceptance Rate / task completion as a proxy — there
// is no explicit accept/reject step in the product yet, so this tracks
// what actually exists: check-in submission and pickup requests).
export function trackGrowerEngagement(
  action: "checkin_submitted" | "pickup_requested",
  params?: GtagEventParams
) {
  event(action, params);
}
