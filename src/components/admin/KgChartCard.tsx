"use client";

import { useState } from "react";
import { BarPairChart } from "@/components/ui/bar-pair-chart";
import { ChartCard, LegendItem } from "@/components/ui/chart-card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { WeekTotal } from "@/lib/admin";

const RANGES = [
  { value: "4", label: "4 weeks" },
  { value: "8", label: "8 weeks" },
  { value: "12", label: "12 weeks" },
];

const kg = (value: number) => `${Math.round(value * 10) / 10} kg`;

// Kilos ordered against kilos delivered, per real week (the old chart was a hardcoded list of
// numbers). The pills choose how many of the twelve weeks sent by the server are shown.
export function KgChartCard({ ordered, delivered }: { ordered: WeekTotal[]; delivered: WeekTotal[] }) {
  const [range, setRange] = useState("8");
  const n = Number(range);
  const o = ordered.slice(-n);
  const d = delivered.slice(-n);
  const totalOrdered = o.reduce((sum, w) => sum + w.value, 0);
  const totalDelivered = d.reduce((sum, w) => sum + w.value, 0);

  return (
    <ChartCard
      title="Weekly volume"
      subtitle="Kilos ordered and kilos delivered each week"
      controls={<SegmentedControl ariaLabel="Chart range" options={RANGES} value={range} onChange={setRange} />}
      legend={
        <>
          <LegendItem swatch="leaf" label="Ordered" value={kg(totalOrdered)} />
          <LegendItem swatch="muted" label="Delivered" value={kg(totalDelivered)} />
        </>
      }
    >
      <BarPairChart
        data={o.map((week, i) => ({ label: week.label, a: week.value, b: d[i]?.value ?? 0 }))}
        aLabel="Ordered"
        bLabel="Delivered"
        format={kg}
        ariaLabel={`Kilos ordered and delivered per week for the last ${range} weeks. Ordered ${kg(totalOrdered)}, delivered ${kg(totalDelivered)}.`}
      />
    </ChartCard>
  );
}
