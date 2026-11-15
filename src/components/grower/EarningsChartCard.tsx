"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { AreaChart } from "@/components/ui/area-chart";
import { ChartCard, LegendItem } from "@/components/ui/chart-card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { rupees, type EarningsBucket } from "@/lib/grower";

const RANGES = [
  { value: "4", label: "4 weeks" },
  { value: "8", label: "8 weeks" },
  { value: "12", label: "12 weeks" },
];

// Weekly paid-out earnings with range pills beside the chart (V4, V5). The server
// sends twelve weeks; the pills only choose how many to show.
export function EarningsChartCard({ buckets, defaultRange = "8" }: { buckets: EarningsBucket[]; defaultRange?: "4" | "8" | "12" }) {
  const [range, setRange] = useState<string>(defaultRange);
  const shown = buckets.slice(-Number(range));
  const total = shown.reduce((sum, bucket) => sum + bucket.value, 0);
  const best = shown.reduce((max, bucket) => (bucket.value > max.value ? bucket : max), shown[0] ?? { label: "", value: 0 });

  return (
    <ChartCard
      title="Weekly earnings"
      subtitle="What was paid out to you each week"
      controls={<SegmentedControl ariaLabel="Chart range" options={RANGES} value={range} onChange={setRange} />}
      legend={
        <>
          <LegendItem swatch="leaf" label="Paid" value={rupees(total)} />
          {best.value > 0 ? <LegendItem swatch="muted" label="Best week" value={rupees(best.value)} /> : null}
        </>
      }
    >
      {total > 0 ? (
        <AreaChart
          data={shown}
          format={rupees}
          seriesLabel="Paid"
          ariaLabel={`Weekly earnings for the last ${range} weeks. Total ${rupees(total)}.`}
        />
      ) : (
        <div className="flex h-48 flex-col items-center justify-center rounded-tile bg-inset/40 text-center">
          <Wallet className="mb-2 h-7 w-7 text-ink-muted" aria-hidden="true" />
          <p className="text-sm font-medium text-ink">No earnings in this period</p>
          <p className="mt-0.5 max-w-xs text-micro text-ink-muted">Payouts appear here once your trays pass quality control.</p>
        </div>
      )}
    </ChartCard>
  );
}
