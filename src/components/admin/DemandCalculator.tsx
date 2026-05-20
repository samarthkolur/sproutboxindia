"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_BUFFER_PERCENT, TRAY_YIELD_GRAMS } from "@/lib/constants";

export function DemandCalculator({ orderIds, totalKg }: { orderIds: string[]; totalKg: number }) {
  const [loading, setLoading] = useState(false);
  const baseTrays = Math.ceil((totalKg * 1000) / TRAY_YIELD_GRAMS);
  const bufferTrays = Math.ceil(baseTrays * DEFAULT_BUFFER_PERCENT);

  async function createPlan() {
    setLoading(true);
    await fetch("/api/admin/demand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds, bufferPercent: DEFAULT_BUFFER_PERCENT }),
    });
    setLoading(false);
  }

  return (
    <div className="rounded-xl bg-sprout-50/70 p-4">
      <p className="text-sm text-text-muted">Total with buffer</p>
      <p className="text-2xl font-black text-sprout-800">{baseTrays + bufferTrays} trays</p>
      <Button disabled={loading || orderIds.length === 0} className="mt-4 bg-sprout-800 text-white hover:bg-sprout-900" onClick={createPlan}>
        Create Production Plan
      </Button>
    </div>
  );
}
