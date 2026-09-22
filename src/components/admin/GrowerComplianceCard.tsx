"use client";

import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { verifyGrowerFssai } from "@/actions/grower.actions";

export function GrowerComplianceCard({
  growerId,
  fssaiRegNumber,
  fssaiVerifiedAt,
}: {
  growerId: string;
  fssaiRegNumber: string | null;
  fssaiVerifiedAt: Date | null;
}) {
  const [verifiedAt, setVerifiedAt] = useState(fssaiVerifiedAt);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setSubmitting(true);
    setError(null);
    const res = await verifyGrowerFssai(growerId);
    if (res?.error) {
      setError(res.error);
    } else {
      setVerifiedAt(new Date());
    }
    setSubmitting(false);
  }

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              verifiedAt ? "bg-sprout-100" : "bg-amber-50"
            }`}
          >
            {verifiedAt ? (
              <ShieldCheck className="h-5 w-5 text-sprout-700" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">FSSAI Compliance</p>
            <p className="mt-0.5 text-xs text-text-muted">
              {fssaiRegNumber ? `Reg. no: ${fssaiRegNumber}` : "No FSSAI registration submitted"}
            </p>
            {verifiedAt && (
              <p className="mt-1 text-xs text-sprout-700">
                Verified {verifiedAt.toLocaleDateString("en-IN")}
              </p>
            )}
          </div>
        </div>

        {!verifiedAt && fssaiRegNumber && (
          <Button
            size="sm"
            onClick={handleVerify}
            disabled={submitting}
            className="shrink-0 bg-sprout-800 text-white hover:bg-sprout-900"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Verified"}
          </Button>
        )}
      </div>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </GlassCard>
  );
}
