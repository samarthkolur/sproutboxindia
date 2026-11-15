"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { getStripeClient } from "@/lib/stripe-client";
import { rupees } from "@/lib/restaurant";

export interface PendingPayment {
  orderId: string;
  clientSecret: string;
  label: string;
  amount: number;
  cropType: string;
  quantityKg: number;
}

function cssColor(name: string, fallback: string) {
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value ? `rgb(${value.replace(/\s+/g, ",")})` : fallback;
  } catch {
    return fallback;
  }
}

/** Stripe draws its own fields, so the page's colours are read from the CSS tokens and handed over. */
export function stripeAppearance(): Appearance {
  return {
    theme: "flat",
    variables: {
      colorPrimary: cssColor("--c-brand", "#2b362a"),
      colorBackground: cssColor("--c-panel-solid", "#f2f8ef"),
      colorText: cssColor("--c-ink", "#222a24"),
      colorTextSecondary: cssColor("--c-ink-soft", "#4a574e"),
      colorDanger: cssColor("--c-risk", "#a83e32"),
      fontFamily: "Outfit, system-ui, sans-serif",
      borderRadius: "14px",
    },
  };
}

function PaymentStep({ payment, onSuccess }: { payment: PendingPayment; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: confirmError } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    setSubmitting(false);
    if (confirmError) {
      setError(confirmError.message || "Payment failed. Please try again.");
      return;
    }
    onSuccess();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-tile bg-inset/60 p-3">
        <span className="min-w-0 text-sm font-medium text-ink">{payment.label}</span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">{rupees(payment.amount)}</span>
      </div>

      <PaymentElement />

      {error ? (
        <p role="alert" className="mt-3 rounded-tile bg-risk-soft px-3 py-2 text-sm font-medium text-risk">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        data-no-global-loading
        onClick={confirm}
        disabled={submitting || !stripe || !elements}
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-base font-medium text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Processing…
          </>
        ) : (
          `Pay ${rupees(payment.amount)}`
        )}
      </button>
    </div>
  );
}

// Pays one or several held orders in turn ("1 of 2"). Closing it leaves the orders awaiting
// payment, which can be finished from the Orders page.
export function CheckoutModal({
  payments,
  onComplete,
  onCancel,
}: {
  payments: PendingPayment[];
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [index, setIndex] = useState(0);
  const stripePromise = getStripeClient();
  const current = payments[index];
  if (!current) return null;

  function next() {
    if (index + 1 < payments.length) setIndex(index + 1);
    else onComplete();
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title="Complete payment"
      description={payments.length > 1 ? `Payment ${index + 1} of ${payments.length}` : "Your order is held until it is paid."}
      footer={
        <button
          type="button"
          data-no-global-loading
          onClick={onCancel}
          className="rounded-full border border-hairline bg-panel/60 px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          Pay later from the Orders page
        </button>
      }
    >
      {stripePromise ? (
        <Elements key={current.orderId} stripe={stripePromise} options={{ clientSecret: current.clientSecret, appearance: stripeAppearance() }}>
          <PaymentStep payment={current} onSuccess={next} />
        </Elements>
      ) : (
        <p className="text-sm text-ink-soft">Online payment is not set up yet. Your order is saved and can be paid from the Orders page once it is.</p>
      )}
    </Modal>
  );
}
