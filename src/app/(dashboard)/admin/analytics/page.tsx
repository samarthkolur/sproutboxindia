import Link from "next/link";
import { CheckCircle2, IndianRupee, Package, Wallet } from "lucide-react";
import { KgChartCard } from "@/components/admin/KgChartCard";
import { MoneyChartCard, OrdersChartCard } from "@/components/admin/AnalyticsCharts";
import { Meter } from "@/components/ui/meter";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Sparkline } from "@/components/ui/sparkline";
import { StatTile } from "@/components/ui/stat-tile";
import { Tabs } from "@/components/ui/tabs";
import { commission, cropName, rupees } from "@/lib/admin";
import { getAdminAnalytics } from "@/lib/admin-data";

const TABS = [
  { value: "revenue", label: "Revenue" },
  { value: "production", label: "Production" },
  { value: "quality", label: "Quality" },
];

const sum = (weeks: { value: number }[]) => weeks.reduce((total, w) => total + w.value, 0);

export default async function AnalyticsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const data = await getAdminAnalytics();
  const tab = TABS.some((t) => t.value === searchParams.tab) ? searchParams.tab! : "revenue";
  const revenue = sum(data.revenue);
  const paidOut = sum(data.payouts);
  const kept = commission(revenue, paidOut);
  const orders = sum(data.orders);
  const reviewed = (data.qc.PASS ?? 0) + (data.qc.RISK ?? 0) + (data.qc.REJECT ?? 0);

  return (
    <>
      <PageHeader title="Analytics" subtitle="The last twelve weeks: what came in, what went out to growers, and what was kept." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Revenue" icon={<IndianRupee />} value={rupees(revenue)} caption="Paid orders, last 12 weeks" trailing={<Sparkline values={data.revenue.map((w) => w.value)} />} />
        <StatTile label="Paid to growers" icon={<Wallet />} value={rupees(paidOut)} caption="Payouts marked paid" trailing={<Sparkline values={data.payouts.map((w) => w.value)} tone="brand" />} />
        <StatTile
          label="Kept by SproutBox"
          icon={<CheckCircle2 />}
          value={rupees(kept.kept)}
          tone={kept.percent !== null ? "good" : "neutral"}
          caption={kept.percent === null ? "Nothing earned yet" : `${kept.percent}% of revenue`}
        />
        <StatTile label="Orders" icon={<Package />} value={orders} caption="Paid orders placed" trailing={<Sparkline values={data.orders.map((w) => w.value)} />} />
      </div>

      <Tabs ariaLabel="Analytics sections" items={TABS} value={tab} hrefFor={(value) => `/admin/analytics?tab=${value}`} className="my-5" />

      {tab === "revenue" ? (
        <div className="space-y-4">
          <MoneyChartCard revenue={data.revenue} payouts={data.payouts} />
          <OrdersChartCard orders={data.orders} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel>
              <PanelHeader title="Top restaurants" subtitle="By revenue, all time" />
              {data.topRestaurants.length > 0 ? (
                <ul className="space-y-3">
                  {data.topRestaurants.map((r) => (
                    <li key={r.id}>
                      <div className="flex items-baseline justify-between gap-3">
                        <Link href={`/admin/restaurants/${r.id}`} className="text-sm font-medium text-ink hover:underline" data-i18n-ignore>
                          {r.name}
                        </Link>
                        <span className="text-sm font-medium tabular-nums text-ink">{rupees(r.revenue)}</span>
                      </div>
                      <p className="mb-1.5 text-micro text-ink-muted">{`${r.orders} ${r.orders === 1 ? "order" : "orders"}`}</p>
                      <Meter value={r.revenue} max={data.topRestaurants[0].revenue} label={`${r.name} revenue`} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">No paid orders yet.</p>
              )}
            </Panel>
            <Panel>
              <PanelHeader title="Revenue by crop" subtitle="All time" />
              {data.crops.length > 0 ? (
                <ul className="space-y-3">
                  {data.crops.map((c) => (
                    <li key={c.cropType}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium text-ink">{cropName(c.cropType)}</span>
                        <span className="text-sm font-medium tabular-nums text-ink">{rupees(c.revenue)}</span>
                      </div>
                      <p className="mb-1.5 text-micro text-ink-muted">{`${Math.round(c.kg * 10) / 10} kg · ${c.orders} ${c.orders === 1 ? "order" : "orders"}`}</p>
                      <Meter value={c.revenue} max={data.crops[0].revenue} label={`${cropName(c.cropType)} revenue`} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">No paid orders yet.</p>
              )}
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "production" ? (
        <div className="space-y-4">
          <KgChartCard ordered={data.orderedKg} delivered={data.deliveredKg} />
          <Panel>
            <PanelHeader title="Kilos by crop" subtitle="Ordered, all time" />
            {data.crops.length > 0 ? (
              <ul className="space-y-3">
                {[...data.crops].sort((a, b) => b.kg - a.kg).map((c) => (
                  <li key={c.cropType}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-ink">{cropName(c.cropType)}</span>
                      <span className="text-sm font-medium tabular-nums text-ink">{`${Math.round(c.kg * 10) / 10} kg`}</span>
                    </div>
                    <Meter value={c.kg} max={Math.max(...data.crops.map((x) => x.kg), 1)} label={`${cropName(c.cropType)} kilos`} className="mt-1.5" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No paid orders yet.</p>
            )}
          </Panel>
        </div>
      ) : null}

      {tab === "quality" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelHeader title="QC results" subtitle="Every reviewed check-in" />
            {reviewed > 0 ? (
              <ul className="space-y-3">
                {([["PASS", "Passed", "leaf"], ["RISK", "Flagged as a risk", "watch"], ["REJECT", "Rejected", "risk"]] as const).map(([key, label, tone]) => (
                  <li key={key}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-ink-soft">{label}</span>
                      <span className="text-sm font-medium tabular-nums text-ink">{data.qc[key] ?? 0}</span>
                    </div>
                    <Meter value={data.qc[key] ?? 0} max={reviewed} tone={tone} label={label} className="mt-1.5" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No check-ins have been reviewed yet.</p>
            )}
          </Panel>
          <Panel>
            <PanelHeader title="Grower quality" subtitle="Share of finished trays that passed" />
            {data.growerQuality.length > 0 ? (
              <ul className="space-y-3">
                {data.growerQuality.slice(0, 8).map((g) => (
                  <li key={g.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/admin/growers/${g.id}`} className="text-sm font-medium text-ink hover:underline" data-i18n-ignore>
                        {g.name}
                      </Link>
                      <span className="text-sm tabular-nums text-ink-soft">{`${Math.round(g.quality * 100)}%`}</span>
                    </div>
                    <Meter value={Math.round(g.quality * 100)} label={`${g.name} quality`} className="mt-1.5" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No trays have finished yet.</p>
            )}
          </Panel>
        </div>
      ) : null}
      {data.ratingCount > 0 && tab === "quality" ? (
        <p className="mt-4 text-sm text-ink-soft">{`Restaurants rate deliveries ${data.rating?.toFixed(1)} out of 5 on average (${data.ratingCount} ${data.ratingCount === 1 ? "rating" : "ratings"}).`}</p>
      ) : null}
    </>
  );
}
