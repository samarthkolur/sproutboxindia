"use client";

import { useState } from "react";
import { AreaChart } from "@/components/ui/area-chart";
import { BarPairChart } from "@/components/ui/bar-pair-chart";
import { ChartCard, LegendItem } from "@/components/ui/chart-card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { commission, rupees, type WeekTotal } from "@/lib/admin";

const RANGES = [
  { value: "4", label: "4 weeks" },
  { value: "8", label: "8 weeks" },
  { value: "12", label: "12 weeks" },
];

const sum = (weeks: WeekTotal[]) => weeks.reduce((total, w) => total + w.value, 0);

// Money in against money out: what restaurants paid, what growers were paid, and what was kept
// (our version of "money in and out").
export function MoneyChartCard({ revenue, payouts }: { revenue: WeekTotal[]; payouts: WeekTotal[] }) {
  const [range, setRange] = useState("8");
  const n = Number(range);
  const r = revenue.slice(-n);
  const p = payouts.slice(-n);
  const kept = commission(sum(r), sum(p));

  return (
    <ChartCard
      title="Revenue and grower payouts"
      subtitle="Paid by restaurants and paid to growers, each week"
      controls={<SegmentedControl ariaLabel="Chart range" options={RANGES} value={range} onChange={setRange} />}
      legend={
        <>
          <LegendItem swatch="leaf" label="Revenue" value={rupees(sum(r))} />
          <LegendItem swatch="muted" label="Paid to growers" value={rupees(sum(p))} />
          <LegendItem swatch="brand" label="Kept" value={kept.percent === null ? rupees(kept.kept) : `${rupees(kept.kept)} (${kept.percent}%)`} />
        </>
      }
    >
      <BarPairChart
        data={r.map((week, i) => ({ label: week.label, a: week.value, b: p[i]?.value ?? 0 }))}
        aLabel="Revenue"
        bLabel="Paid to growers"
        format={rupees}
        ariaLabel={`Revenue and grower payouts per week for the last ${range} weeks. Revenue ${rupees(sum(r))}, paid to growers ${rupees(sum(p))}.`}
      />
    </ChartCard>
  );
}

export function OrdersChartCard({ orders }: { orders: WeekTotal[] }) {
  const [range, setRange] = useState("8");
  const shown = orders.slice(-Number(range));
  const total = sum(shown);

  return (
    <ChartCard
      title="Orders over time"
      subtitle="Paid orders placed each week"
      controls={<SegmentedControl ariaLabel="Chart range" options={RANGES} value={range} onChange={setRange} />}
      legend={<LegendItem swatch="leaf" label="Orders" value={String(total)} />}
    >
      <AreaChart data={shown} seriesLabel="Orders" ariaLabel={`Orders per week for the last ${range} weeks. ${total} in total.`} />
    </ChartCard>
  );
}
