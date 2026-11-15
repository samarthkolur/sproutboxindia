import { kpiVerdict, rupees, type KpiVerdict } from "@/lib/admin";

// The seven KPIs from the product measurement framework, their Month-6 targets and how each
// is judged. The numbers come from live data (lib/admin-data getKpiSnapshot); the targets used to
// be typed into the page as strings, and now live here once.

export const KPI_TARGETS = {
  kgPerWeek: 300,
  qcPassRate: 0.95,
  onTimeRate: 0.95,
  growers: 150,
  acceptanceRate: 0.9,
  mrr: 540000,
  churnRate: 0.03,
} as const;

export interface KpiSnapshot {
  kgDeliveredPerWeek: { value: number; weeks: number[] };
  qcPassRate: { value: number | null; sampleSize: number };
  onTimeDeliveryRate: { value: number | null; sampleSize: number };
  activeCertifiedGrowers: { value: number };
  growerAcceptanceRate: { value: null; note: string };
  mrr: { value: number };
  restaurantChurnRate: { value: number | null; cohortSize: number };
}

export interface KpiCard {
  key: string;
  name: string;
  category: string;
  value: string;
  target: string;
  verdict: KpiVerdict;
  /** 0 to 1 of the way to the target, for the thin meter; null when there is nothing to measure. */
  progress: number | null;
  caption: string;
  /** How it is computed, for the Definitions section. */
  definition: string;
  /** A trend, only where one can be computed from the data. */
  series?: number[];
}

const percent = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`);
const ratio = (value: number | null, target: number) => (value === null ? null : Math.min(1, value / target));

export function kpiCards(snapshot: KpiSnapshot): KpiCard[] {
  const t = KPI_TARGETS;
  const { kgDeliveredPerWeek: kg, qcPassRate: qc, onTimeDeliveryRate: onTime, activeCertifiedGrowers: growers, mrr, restaurantChurnRate: churn } = snapshot;
  return [
    {
      key: "kg",
      name: "Kg delivered per week",
      category: "Engagement and operations (North Star)",
      value: `${Math.round(kg.value * 10) / 10} kg`,
      target: `Target ${t.kgPerWeek} kg`,
      verdict: kpiVerdict(kg.value, t.kgPerWeek),
      progress: ratio(kg.value, t.kgPerWeek),
      caption: `Delivered in the last 7 days. Target ${t.kgPerWeek} kg.`,
      definition: "Kilos on orders whose delivery was marked delivered in the last seven days.",
      series: kg.weeks.length >= 2 ? kg.weeks : undefined,
    },
    {
      key: "qc",
      name: "QC pass rate",
      category: "Quality",
      value: percent(qc.value),
      target: `Target ${percent(t.qcPassRate)}`,
      verdict: kpiVerdict(qc.value, t.qcPassRate),
      progress: ratio(qc.value, t.qcPassRate),
      caption: qc.value === null ? "No check-ins have been reviewed yet." : `Target ${percent(t.qcPassRate)}. From ${qc.sampleSize} reviewed check-ins.`,
      definition: `Share of reviewed check-ins that passed. Based on ${qc.sampleSize} reviewed check-ins (qcResult set).`,
    },
    {
      key: "ontime",
      name: "On-time delivery rate",
      category: "Retention",
      value: percent(onTime.value),
      target: `Target ${percent(t.onTimeRate)}`,
      verdict: kpiVerdict(onTime.value, t.onTimeRate),
      progress: ratio(onTime.value, t.onTimeRate),
      caption: onTime.value === null ? "No deliveries have completed yet." : `Target ${percent(t.onTimeRate)}. From ${onTime.sampleSize} completed deliveries.`,
      definition: `Share of completed deliveries that arrived by the end of the delivery date. Based on ${onTime.sampleSize} completed deliveries.`,
    },
    {
      key: "growers",
      name: "Active certified growers",
      category: "Acquisition (supply)",
      value: String(growers.value),
      target: `Target ${t.growers}`,
      verdict: kpiVerdict(growers.value, t.growers),
      progress: ratio(growers.value, t.growers),
      caption: `Target ${t.growers} growers.`,
      definition: "A stand-in: the number of active growers. The product has no separate certification flag yet.",
    },
    {
      key: "acceptance",
      name: "Grower acceptance rate",
      category: "Engagement (supply)",
      value: "—",
      target: `Target ${percent(t.acceptanceRate)}`,
      verdict: "nodata",
      progress: null,
      caption: "Cannot be measured yet.",
      definition: snapshot.growerAcceptanceRate.note,
    },
    {
      key: "mrr",
      name: "Monthly recurring revenue",
      category: "Revenue",
      value: rupees(mrr.value),
      target: `Target ${rupees(t.mrr)}`,
      verdict: kpiVerdict(mrr.value, t.mrr),
      progress: ratio(mrr.value, t.mrr),
      caption: `Last 30 days. Target ${rupees(t.mrr)}.`,
      definition: "A stand-in: revenue from paid, non-cancelled orders in the last 30 days. True recurring revenue needs subscription billing, which is not built yet.",
    },
    {
      key: "churn",
      name: "Restaurant churn rate",
      category: "Retention",
      value: percent(churn.value),
      target: `Target at most ${percent(t.churnRate)}`,
      verdict: kpiVerdict(churn.value, t.churnRate, true),
      progress: churn.value === null ? null : Math.max(0, 1 - churn.value / Math.max(t.churnRate * 4, 0.01)),
      caption: churn.value === null ? "Not enough order history yet." : `Target at most ${percent(t.churnRate)} a month. Cohort of ${churn.cohortSize}.`,
      definition: `Cohort: ${churn.cohortSize} restaurants with an order older than 30 days. Churned means no order in the last 30 days.`,
    },
  ];
}
