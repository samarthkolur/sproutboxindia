"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, CheckCircle2, Loader2, Package, Target } from "lucide-react";
import { toast } from "sonner";
import { createProductionPlans } from "@/actions/demand.actions";
import { EmptyState } from "@/components/shared/EmptyState";
import { DetailLayout } from "@/components/ui/detail-layout";
import { FilterChips } from "@/components/ui/filter-chips";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusChip, type Tone } from "@/components/ui/status-chip";
import { cropName, planOrder, shortId, sortByUrgency, urgencyOf, type Urgency } from "@/lib/admin";
import { cn } from "@/lib/utils";

export interface DemandOrder {
  id: string;
  cropType: string;
  quantityKg: number;
  deliveryDate: Date;
  restaurant: { businessName: string };
}

const URGENCY_TONE: Record<Urgency, Tone> = { overdue: "risk", urgent: "watch", soon: "info", ok: "neutral" };

function urgencyLabel(level: Urgency, days: number) {
  if (level === "overdue") return days === -1 ? "1 day overdue" : `${-days} days overdue`;
  return days === 0 ? "Delivery today" : days === 1 ? "Delivery tomorrow" : `Delivery in ${days} days`;
}

// Orders waiting for a plan, nearest delivery first. Click one to see the calculation; tick
// several and create their plans together. The maths is planOrder(): the same function the
// create-plan action stores, so the preview is what gets saved.
export function DemandClient({ orders: initial }: { orders: DemandOrder[] }) {
  const [orders, setOrders] = useState(() => sortByUrgency(initial));
  const [crop, setCrop] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(() => sortByUrgency(initial)[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(0);

  const crops = useMemo(() => Array.from(new Set(orders.map((o) => o.cropType))), [orders]);
  const shown = crop === "all" ? orders : orders.filter((o) => o.cropType === crop);
  const preview = orders.find((o) => o.id === previewId) ?? shown[0] ?? null;
  const plan = preview ? planOrder(preview) : null;
  const picked = shown.filter((o) => selected.has(o.id));

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  async function create(ids: string[]) {
    if (ids.length === 0) return;
    setBusy(true);
    try {
      const result = await createProductionPlans(ids);
      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      const failedIds = new Set(result.failed?.map((f) => f.orderId));
      const done = ids.filter((id) => !failedIds.has(id));
      setOrders((current) => current.filter((o) => !done.includes(o.id)));
      setSelected((current) => new Set(Array.from(current).filter((id) => !done.includes(id))));
      setCreated((n) => n + (result.created ?? 0));
      if (previewId && done.includes(previewId)) setPreviewId(null);
      if (failedIds.size > 0) toast.error(`${failedIds.size} could not be planned`, { description: result.failed?.[0]?.error });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {created > 0 ? (
        <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-panel bg-leaf-soft/80 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-ink">
            <CheckCircle2 className="h-5 w-5 text-good" aria-hidden="true" />
            {created === 1 ? "1 production plan created" : `${created} production plans created`}
          </p>
          <Link href="/admin/allocate" className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-ink">
            <Target className="h-4 w-4" aria-hidden="true" />
            Allocate now
          </Link>
        </div>
      ) : null}

      {orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders waiting for a plan" description="Every paid order already has a production plan." />
      ) : (
        <DetailLayout
          aside={
            <Panel className="lg:sticky lg:top-24">
              <PanelHeader title="Plan preview" subtitle={preview ? `${cropName(preview.cropType)}, ${preview.quantityKg} kg` : undefined} />
              {preview && plan ? (
                <>
                  <p className="text-sm text-ink-soft">{preview.restaurant.businessName}</p>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      ["Base trays", plan.baseTrays],
                      [`Buffer ${Math.round(plan.bufferPercent * 100)}%`, `+${plan.bufferTrays}`],
                      ["Total trays", plan.totalTrays],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-tile bg-inset/60 p-3">
                        <dt className="text-micro text-ink-muted">{label}</dt>
                        <dd className="mt-1 text-2xl font-light tabular-nums text-ink">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Sow from</dt>
                      <dd className="font-medium text-ink">{format(plan.sowDate, "d MMM yyyy")}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Harvest</dt>
                      <dd className="font-medium text-ink">{format(plan.harvestDate, "d MMM yyyy")}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Delivery</dt>
                      <dd className="font-medium text-ink">{format(preview.deliveryDate, "d MMM yyyy")}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-ink-muted">Grow cycle</dt>
                      <dd className="font-medium text-ink">{`${plan.cycleDays} days`}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    data-no-global-loading
                    disabled={busy}
                    onClick={() => create([preview.id])}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
                    Create production plan
                  </button>
                </>
              ) : (
                <p className="text-sm text-ink-muted">Choose an order to see how many trays it needs.</p>
              )}
            </Panel>
          }
        >
          <FilterChips
            ariaLabel="Filter by crop"
            value={crop}
            onChange={setCrop}
            chips={[{ value: "all", label: "All", count: orders.length }, ...crops.map((c) => ({ value: c, label: cropName(c), count: orders.filter((o) => o.cropType === c).length }))]}
          />

          {picked.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-panel bg-brand p-3 text-brand-ink">
              <p className="pl-2 text-sm">{`${picked.length} selected`}</p>
              <button
                type="button"
                data-no-global-loading
                disabled={busy}
                onClick={() => create(picked.map((o) => o.id))}
                className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-4 py-2 text-sm font-medium text-brand transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
                {`Create plans (${picked.length})`}
              </button>
            </div>
          ) : null}

          <Panel padding="none">
            <ul className="divide-y divide-hairline/70">
              {shown.map((order) => {
                const urgency = urgencyOf(order.deliveryDate);
                const active = preview?.id === order.id;
                return (
                  <li key={order.id} className={cn("flex items-center gap-3 px-4 py-3", active && "bg-leaf-soft/50")}>
                    <input
                      type="checkbox"
                      checked={selected.has(order.id)}
                      onChange={() => toggle(order.id)}
                      aria-label={`Select order ${shortId(order.id)}`}
                      className="h-4 w-4 shrink-0 accent-[rgb(var(--c-brand))]"
                    />
                    <button
                      type="button"
                      data-no-global-loading
                      onClick={() => setPreviewId(order.id)}
                      aria-pressed={active}
                      className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{order.restaurant.businessName}</span>
                        <span className="block text-micro text-ink-muted">{`${cropName(order.cropType)}, ${order.quantityKg} kg · ${shortId(order.id)}`}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <StatusChip tone={URGENCY_TONE[urgency.level]} label={urgencyLabel(urgency.level, urgency.days)} />
                        <ArrowRight className="hidden h-4 w-4 text-ink-muted sm:block" aria-hidden="true" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </DetailLayout>
      )}
    </>
  );
}
