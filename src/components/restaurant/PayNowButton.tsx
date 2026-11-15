"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trackPurchase } from "@/lib/gtag";
import { cn } from "@/lib/utils";
import { CheckoutModal, type PendingPayment } from "./CheckoutModal";

// "Pay now" on an order that was placed but not paid. It asks the server for the order's
// existing PaymentIntent, so paying later never creates a second charge.
export function PayNowButton({
  orderId,
  amount,
  cropType,
  quantityKg,
  label,
  size = "md",
  className,
}: {
  orderId: string;
  amount: number;
  cropType: string;
  quantityKg: number;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PendingPayment | null>(null);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch(`/api/restaurant/orders/${orderId}/payment`);
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || "Could not start the payment");
      if (body.data.alreadyPaid) {
        toast.success("This order is already paid");
        router.refresh();
        return;
      }
      setPayment({ orderId, clientSecret: body.data.clientSecret, label, amount, cropType, quantityKg });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start the payment");
    } finally {
      setLoading(false);
    }
  }

  function done() {
    trackPurchase({ transactionId: orderId, value: amount, cropType, quantityKg });
    setPayment(null);
    toast.success("Payment received", { description: "Your order is confirmed in a moment." });
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        data-no-global-loading
        onClick={start}
        disabled={loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full bg-brand font-medium text-brand-ink transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 disabled:opacity-60",
          size === "sm" ? "px-3.5 py-1.5 text-sm" : "px-5 py-2.5 text-sm",
          className
        )}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <CreditCard className="h-4 w-4" aria-hidden="true" />}
        Pay now
      </button>
      {payment ? <CheckoutModal payments={[payment]} onComplete={done} onCancel={() => setPayment(null)} /> : null}
    </>
  );
}
