import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowRight, BellRing, CheckCircle2, IndianRupee, Package, Sprout, Truck, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { KgChartCard } from "@/components/admin/KgChartCard";
import { Meter } from "@/components/ui/meter";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusChip } from "@/components/ui/status-chip";
import { PIPELINE_STEPS, cropName, pipelineClauses, rupees, shortId } from "@/lib/admin";
import { getAdminOverview } from "@/lib/admin-data";
import { greetingFor } from "@/lib/grower";
import { cn } from "@/lib/utils";

// Each clause is its own text node, so each can be translated on its own.
function PipelineSubtitle({ clauses }: { clauses: string[] }) {
  if (clauses.length === 0) return <>Everything is up to date. Nothing is waiting for you.</>;
  return (
    <>
      {clauses.map((clause, index) => (
        <span key={clause}>
          <span>{clause}</span>
          <span aria-hidden="true">{index < clauses.length - 1 ? ", " : "."}</span>
        </span>
      ))}
    </>
  );
}

export default async function AdminDashboard() {
  const session = await auth();
  const now = new Date();
  const data = await getAdminOverview(session?.user?.id ?? "", now);
  const { pipeline } = data;

  return (
    <>
      <PageHeader eyebrow={format(now, "EEEE, d MMMM")} title={greetingFor(now)} subtitle={<PipelineSubtitle clauses={pipelineClauses(pipeline)} />} />

      {/* The pipeline, in order: each step is a count and a link to its page. */}
      <nav aria-label="Pipeline" className="mb-4">
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PIPELINE_STEPS.map((step, index) => {
            const count = pipeline[step.key];
            return (
              <li key={step.key}>
                <Link
                  href={step.href}
                  className={cn(
                    "group flex h-full flex-col rounded-tile border border-white/50 p-4 shadow-panel transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                    count > 0 ? "bg-watch-soft/80" : "bg-panel/55"
                  )}
                >
                  <span className="flex items-center justify-between text-sm text-ink-soft">
                    <span>{`${index + 1}. ${step.label}`}</span>
                    <ArrowRight className="h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                  <span className="mt-2 text-3xl font-light leading-none tabular-nums text-ink">{count}</span>
                  <span className="mt-2 text-micro text-ink-muted">{count > 0 ? step.caption : "Nothing waiting"}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Active orders" icon={<Package />} value={data.activeOrders} caption={`${data.orderTotals} orders in total`} />
        <StatTile label="Revenue" icon={<IndianRupee />} value={rupees(data.revenue)} caption="From paid orders" />
        <StatTile label="Trays growing" icon={<Sprout />} value={data.traysGrowing} caption="Across all growers" />
        <StatTile
          label="QC pass rate"
          icon={<CheckCircle2 />}
          value={data.qcRate === null ? "—" : `${data.qcRate}%`}
          tone={data.qcRate === null ? "neutral" : data.qcRate >= 90 ? "good" : "watch"}
          caption={data.qcRate === null ? "No trays reviewed yet" : data.qcRate >= 90 ? "On target" : "Below the 90% target"}
          href="/admin/kpis"
        />
        <StatTile label="Growers" icon={<Users />} value={data.activeGrowers} caption={`${data.growers} registered`} href="/admin/growers" />
        <StatTile label="In transit" icon={<Truck />} value={data.inTransit} caption={data.inTransit === 1 ? "Delivery on the road" : "Deliveries on the road"} href="/admin/deliveries" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-5">
        <div className="min-w-0 space-y-4">
          <KgChartCard ordered={data.weeks.orderedKg} delivered={data.weeks.deliveredKg} />

          <Panel>
            <PanelHeader title="Recent orders" subtitle="The latest six, newest first" />
            {data.recentOrders.length > 0 ? (
              <ul className="divide-y divide-hairline/70">
                {data.recentOrders.map((order) => (
                  <li key={order.id} className="relative flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/restaurants/${order.restaurant.id}`}
                        className="text-sm font-medium text-ink after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand/50"
                      >
                        {order.restaurant.businessName}
                      </Link>
                      <p className="mt-0.5 text-micro text-ink-muted">{`${cropName(order.cropType)}, ${order.quantityKg} kg · ${shortId(order.id)}`}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusChip status={order.status} />
                      <span className="w-20 text-right text-sm font-medium tabular-nums text-ink">{rupees(order.totalPrice)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No orders yet.</p>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-4">
          <Panel>
            <PanelHeader
              title="Top growers"
              subtitle="By overall score"
              actions={
                <Link href="/admin/growers" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
                  View all
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              }
            />
            {data.topGrowers.length > 0 ? (
              <ul className="space-y-3">
                {data.topGrowers.map((grower) => (
                  <li key={grower.id} className="relative">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/admin/growers/${grower.id}`} className="text-sm font-medium text-ink after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand/50">
                        {grower.name}
                      </Link>
                      <span className="text-sm tabular-nums text-ink-soft">{`${Math.round(grower.score * 100)}%`}</span>
                    </div>
                    <p className="mb-1.5 text-micro text-ink-muted">{`${grower.city} · ${grower.trays} trays`}</p>
                    <Meter value={Math.round(grower.score * 100)} label={`${grower.name} score`} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No active growers yet.</p>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Recent activity" subtitle="Updates sent to you" />
            {data.activity.length > 0 ? (
              <ul className="space-y-4">
                {data.activity.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <span aria-hidden="true" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leaf-soft text-ink-soft">
                      <BellRing className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{item.title}</p>
                      <p className="text-sm text-ink-soft">{item.message}</p>
                      <time data-i18n-ignore dateTime={item.createdAt.toISOString()} className="text-micro text-ink-muted">
                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">Nothing new. Pickup requests and QC alerts appear here.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
