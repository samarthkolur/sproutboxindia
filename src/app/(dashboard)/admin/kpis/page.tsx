import { ChevronDown } from "lucide-react";
import { Meter } from "@/components/ui/meter";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Sparkline } from "@/components/ui/sparkline";
import { getKpiSnapshot } from "@/lib/admin-data";
import { kpiCards, type KpiCard } from "@/lib/kpi";
import { cn } from "@/lib/utils";

const TINT = { met: "bg-leaf-soft/70", below: "bg-watch-soft/80", nodata: "bg-panel/55" } as const;
const VERDICT = { met: "Target met", below: "Below target", nodata: "No data yet" } as const;
const TONE = { met: "leaf", below: "watch", nodata: "leaf" } as const;

function Card({ card }: { card: KpiCard }) {
  return (
    <li className={cn("flex flex-col rounded-tile border border-white/50 p-4 shadow-panel backdrop-blur-[2px] dark:border-white/5", TINT[card.verdict])}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-ink-soft">{card.name}</p>
        <span className={cn("shrink-0 text-micro font-medium", card.verdict === "met" ? "text-good" : card.verdict === "below" ? "text-watch" : "text-ink-muted")}>{VERDICT[card.verdict]}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-3xl font-light leading-none tracking-tight tabular-nums text-ink">{card.value}</p>
        {card.series ? <Sparkline values={card.series} tone={TONE[card.verdict]} /> : null}
      </div>
      <div className="mt-3">
        {card.progress !== null ? <Meter value={Math.round(card.progress * 100)} tone={TONE[card.verdict]} label={`${card.name}: progress towards the target`} /> : <div className="h-1.5 rounded-full bg-inset" aria-hidden="true" />}
      </div>
      <p className="mt-2 text-micro text-ink-muted">{card.caption}</p>
    </li>
  );
}

export default async function AdminKpisPage() {
  const cards = kpiCards(await getKpiSnapshot());
  const met = cards.filter((c) => c.verdict === "met").length;
  const measured = cards.filter((c) => c.verdict !== "nodata").length;

  return (
    <>
      <PageHeader
        title="KPI scorecard"
        subtitle={`${met} of ${measured} measured KPIs are on target. Values come from live data against the Month-6 targets, not from GA4.`}
      />

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.key} card={card} />
        ))}
      </ul>

      <Panel className="mt-5">
        <PanelHeader title="Definitions" subtitle="How each number is worked out, and which are stand-ins" />
        <div className="divide-y divide-hairline/70">
          {cards.map((card) => (
            <details key={card.key} className="group py-3 first:pt-0 last:pb-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded text-sm font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 [&::-webkit-details-marker]:hidden">
                <span>
                  {card.name}
                  <span className="ml-2 text-micro font-normal text-ink-muted">{card.category}</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
              </summary>
              <p className="mt-2 text-sm text-ink-soft">{card.definition}</p>
              <p className="mt-1 text-micro text-ink-muted">{card.target}</p>
            </details>
          ))}
        </div>
      </Panel>
    </>
  );
}
