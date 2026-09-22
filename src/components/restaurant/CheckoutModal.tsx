"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStripeClient } from "@/lib/stripe-client";

export interface PendingPayment {
  orderId: string;
  clientSecret: string;
  label: string;
  amount: number;
  cropType: string;
  quantityKg: number;
}

function PaymentStep({
  payment,
  onSuccess,
}: {
  payment: PendingPayment;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onSuccess();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-xl bg-sprout-50/70 p-3">
        <span className="text-sm font-semibold text-text-primary">{payment.label}</span>
        <span className="text-sm font-black text-sprout-800">
          ₹{payment.amount.toLocaleString("en-IN")}
        </span>
      </div>

      <PaymentElement />

      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      <Button
        onClick={handleConfirm}
        disabled={submitting || !stripe || !elements}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sprout-800 font-bold text-white hover:bg-sprout-900"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Processing…
          </>
        ) : (
          `Pay ₹${payment.amount.toLocaleString("en-IN")}`
        )}
      </Button>
    </div>
  );
}

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

  if (!stripePromise || !current) return null;

  function handleStepSuccess() {
    if (index + 1 < payments.length) {
      setIndex((i) => i + 1);
    } else {
      onComplete();
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-text-primary">
              Complete Payment {payments.length > 1 ? `(${index + 1} of ${payments.length})` : ""}
            </h3>
            <p className="mt-0.5 text-sm text-text-muted">
              Your order is reserved until payment is completed.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Elements
          key={current.orderId}
          stripe={stripePromise}
          options={{ clientSecret: current.clientSecret }}
        >
          <PaymentStep payment={current} onSuccess={handleStepSuccess} />
        </Elements>

        <button
          onClick={onCancel}
          className="mt-3 w-full text-center text-xs font-medium text-text-muted hover:text-text-primary"
        >
          Pay later from the Orders page
        </button>
      </div>
    </div>
  );
}
