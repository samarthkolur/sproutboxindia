"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NEXT_DELIVERY_STEP } from "@/lib/admin";

// The one next step for a delivery, as a button on its row: packed, then in transit, then
// delivered. Delivered also marks the order delivered (the API does both).
export function DeliveryActions({ deliveryId, status, label }: { deliveryId: string; status: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const step = NEXT_DELIVERY_STEP[status];
  if (!step) return null;

  async function advance() {
    if (!step) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/delivery/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: step.status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not update the delivery");
      }
      toast.success(step.status === "DELIVERED" ? "Marked delivered" : step.status === "IN_TRANSIT" ? "Marked in transit" : "Marked packed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the delivery");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      data-no-global-loading
      onClick={advance}
      disabled={busy}
      aria-label={`${step.label} for ${label}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-panel/60 px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
      {step.label}
    </button>
  );
}
