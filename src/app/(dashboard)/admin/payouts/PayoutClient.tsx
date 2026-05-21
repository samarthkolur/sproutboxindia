"use client";

import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { CreditCard, Clock, ArrowDownLeft, CheckCircle2, Loader2 } from "lucide-react";
import { markPayoutAsPaid } from "@/actions/payout.actions";

type PayoutItem = {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
  grower: {
    user: {
      name: string | null;
    };
  };
};

export function PayoutClient({ initialPayouts }: { initialPayouts: PayoutItem[] }) {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMarkPaid = async (payoutId: string) => {
    setProcessingId(payoutId);
    setError(null);

    const res = await markPayoutAsPaid(payoutId);

    if (res?.error) {
      setError(res.error);
      setProcessingId(null);
    } else {
      setPayouts((prev) =>
        prev.map((p) =>
          p.id === payoutId ? { ...p, status: "PAID" } : p
        )
      );
      setProcessingId(null);
    }
  };

  if (payouts.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-16">
          <CreditCard className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            No payouts
          </h3>
          <p className="text-sm text-text-muted">
            Payouts will be generated when batches pass QC
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <h2 className="text-lg font-bold text-text-primary mb-5">Recent Payouts</h2>
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500 mb-4">
          {error}
        </div>
      )}
      <div className="space-y-3">
        {payouts.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-4 rounded-xl border border-white/40 bg-white/50 p-4 row-hover sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  p.status === "PAID" ? "bg-sprout-100" : "bg-amber-100"
                }`}
              >
                {p.status === "PAID" ? (
                  <ArrowDownLeft className="w-5 h-5 text-sprout-600" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">
                  {p.grower.user.name}
                </p>
                <p className="text-xs text-text-muted">
                  {new Date(p.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="text-right">
                <p className="text-sm font-bold text-text-primary">
                  ₹{p.amount.toLocaleString("en-IN")}
                </p>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    p.status === "PAID"
                      ? "bg-sprout-50 text-sprout-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              
              {p.status === "PENDING" && (
                <button
                  disabled={processingId === p.id}
                  onClick={() => handleMarkPaid(p.id)}
                  className="bg-sprout-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-sprout-900 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === p.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  Mark Paid
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
