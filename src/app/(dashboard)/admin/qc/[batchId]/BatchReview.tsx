"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { processQCCheckIn } from "@/actions/qc.actions";
import { QCReview, type ReviewItem } from "@/components/admin/QCReview";
import type { QcDecision } from "@/lib/admin";

export function BatchReview({ item }: { item: ReviewItem }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function decide(result: QcDecision, notes: string, checkInId: string) {
    setBusy(true);
    try {
      const res = await processQCCheckIn(checkInId, result, notes || undefined);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
        return false;
      }
      toast.success(result === "PASS" ? "Tray passed" : result === "REJECT" ? "Tray rejected" : "Flagged as a risk");
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  return <QCReview item={item} onDecide={decide} busy={busy} />;
}
