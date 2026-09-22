import { GlassCard } from "@/components/shared/GlassCard";
import { getKpiSnapshot } from "@/actions/kpi.actions";
import { Gauge, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

function formatPercent(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

type Verdict = "met" | "below" | "no-data";

function StatusPill({ verdict }: { verdict: Verdict }) {
  if (verdict === "met") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sprout-100 px-2.5 py-1 text-xs font-semibold text-sprout-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Target met
      </span>
    );
  }
  if (verdict === "below") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
        <XCircle className="h-3.5 w-3.5" /> Below target
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
      <MinusCircle className="h-3.5 w-3.5" /> No data yet
    </span>
  );
}

export default async function AdminKpisPage() {
  const kpi = await getKpiSnapshot();

  const rows: {
    name: string;
    category: string;
    target: string;
    actual: string;
    verdict: Verdict;
    note?: string;
  }[] = [
    {
      name: "Kg Delivered / Week (North Star)",
      category: "Engagement / Operations",
      target: "≥ 300 kg",
      actual: `${kpi.kgDeliveredPerWeek.value.toFixed(1)} kg`,
      verdict: kpi.kgDeliveredPerWeek.value >= kpi.kgDeliveredPerWeek.target ? "met" : "below",
      note: "Sum of quantityKg on deliveries marked DELIVERED in the last 7 days.",
    },
    {
      name: "QC Pass Rate",
      category: "Quality / Retention",
      target: "≥ 95%",
      actual: formatPercent(kpi.qcPassRate.value),
      verdict:
        kpi.qcPassRate.value === null
          ? "no-data"
          : kpi.qcPassRate.value >= kpi.qcPassRate.target
            ? "met"
            : "below",
      note: `Based on ${kpi.qcPassRate.sampleSize} reviewed check-ins (qcResult set).`,
    },
    {
      name: "On-Time Delivery Rate",
      category: "Retention",
      target: "≥ 95%",
      actual: formatPercent(kpi.onTimeDeliveryRate.value),
      verdict:
        kpi.onTimeDeliveryRate.value === null
          ? "no-data"
          : kpi.onTimeDeliveryRate.value >= kpi.onTimeDeliveryRate.target
            ? "met"
            : "below",
      note: `Based on ${kpi.onTimeDeliveryRate.sampleSize} completed deliveries (deliveredAt vs. order.deliveryDate).`,
    },
    {
      name: "Active Certified Growers",
      category: "Acquisition (Supply)",
      target: "≥ 150",
      actual: `${kpi.activeCertifiedGrowers.value}`,
      verdict: kpi.activeCertifiedGrowers.value >= kpi.activeCertifiedGrowers.target ? "met" : "below",
      note: "Proxy: Grower.isActive count. The product has no separate SBCG certification flag yet.",
    },
    {
      name: "Grower Acceptance Rate",
      category: "Engagement (Supply)",
      target: "≥ 90%",
      actual: "—",
      verdict: "no-data",
      note: kpi.growerAcceptanceRate.note,
    },
    {
      name: "Monthly Recurring Revenue (MRR)",
      category: "Revenue",
      target: "≥ ₹5.4L",
      actual: formatCurrency(kpi.mrr.value),
      verdict: kpi.mrr.value >= kpi.mrr.target ? "met" : "below",
      note: "Proxy: revenue from non-cancelled, paid orders in the trailing 30 days. True MRR needs subscription-cycle modeling not yet built (Order.recurrence is unused for billing).",
    },
    {
      name: "Restaurant Churn Rate",
      category: "Retention",
      target: "≤ 3% / month",
      actual: formatPercent(kpi.restaurantChurnRate.value),
      verdict:
        kpi.restaurantChurnRate.value === null
          ? "no-data"
          : kpi.restaurantChurnRate.value <= kpi.restaurantChurnRate.target
            ? "met"
            : "below",
      note: `Cohort: ${kpi.restaurantChurnRate.cohortSize} restaurants with an order older than 30 days; churned = no order in the trailing 30 days.`,
    },
  ];

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <div className="mb-1 flex items-center gap-2 sm:gap-3">
          <Gauge className="h-6 w-6 flex-shrink-0 text-sprout-700 sm:h-7 sm:w-7" />
          <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
            KPI Scorecard
          </h1>
        </div>
        <p className="text-sm text-text-secondary sm:text-base">
          Live, database-computed values against the Month-6 targets from the product measurement
          framework — not GA4 data. GA4 tracks the acquisition/engagement/conversion funnel
          separately; see the Analytics page there for that.
        </p>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-sprout-200/40 text-xs font-semibold uppercase tracking-wider text-text-muted">
                <th className="py-3 pr-4">KPI</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Target (M6)</th>
                <th className="py-3 pr-4">Actual</th>
                <th className="py-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-b border-sprout-200/20 align-top last:border-0">
                  <td className="py-4 pr-4 font-semibold text-text-primary">{row.name}</td>
                  <td className="py-4 pr-4 text-text-muted">{row.category}</td>
                  <td className="py-4 pr-4 font-medium text-text-primary">{row.target}</td>
                  <td className="py-4 pr-4 text-lg font-black text-text-primary">{row.actual}</td>
                  <td className="py-4 pr-4">
                    <StatusPill verdict={row.verdict} />
                    {row.note && <p className="mt-2 max-w-xs text-xs text-text-muted">{row.note}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
