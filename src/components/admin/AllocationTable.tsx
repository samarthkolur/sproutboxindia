"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AllocationResult } from "@/types";

export function AllocationTable({ planId, initialAllocations }: { planId: string; initialAllocations: AllocationResult[] }) {
  const [allocations, setAllocations] = useState(initialAllocations);

  async function dispatch() {
    await fetch("/api/admin/allocate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, allocations }),
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-sprout-800/10 bg-white/60">
      <table className="w-full min-w-[520px] text-sm">
        <thead><tr className="text-left text-text-muted"><th className="p-3">Grower</th><th className="p-3">Score</th><th className="p-3">Trays</th></tr></thead>
        <tbody>
          {allocations.map((allocation, index) => (
            <tr key={allocation.growerId} className="border-t border-sprout-800/10">
              <td className="p-3 font-semibold">{allocation.growerName || allocation.growerId}</td>
              <td className="p-3">{Math.round((allocation.compositeScore || 0) * 100)}%</td>
              <td className="p-3">
                <input className="h-9 w-20 rounded-lg border px-2" type="number" value={allocation.trayCount} onChange={(event) => {
                  const next = [...allocations];
                  next[index] = { ...allocation, trayCount: Number(event.target.value) };
                  setAllocations(next);
                }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-3">
        <Button className="bg-sprout-800 text-white hover:bg-sprout-900" onClick={dispatch}>Dispatch Tasks</Button>
      </div>
    </div>
  );
}
