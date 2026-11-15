"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AlertTriangle, Loader2, MapPin, Navigation, ShieldCheck, Target } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { DetailLayout } from "@/components/ui/detail-layout";
import { controlClass } from "@/components/ui/field";
import { Meter } from "@/components/ui/meter";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { SearchPill } from "@/components/ui/search-pill";
import { StatusChip, type Tone } from "@/components/ui/status-chip";
import {
  checkAllocation,
  cropName,
  proposeAllocation,
  scoreCandidates,
  shortId,
  urgencyOf,
  type GrowerInput,
  type Urgency,
} from "@/lib/admin";
import { cn } from "@/lib/utils";

export interface AllocatablePlan {
  id: string;
  totalTrays: number;
  bufferTrays: number;
  sowDate: Date;
  harvestDate: Date;
  order: {
    cropType: string;
    quantityKg: number;
    deliveryDate: Date;
    restaurant: { businessName: string; city: string; lat: number | null; lng: number | null };
  };
}

const URGENCY_TONE: Record<Urgency, Tone> = { overdue: "risk", urgent: "watch", soon: "info", ok: "neutral" };

export function AllocateClient({ plans: initial, growers }: { plans: AllocatablePlan[]; growers: GrowerInput[] }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initial);
  const [planId, setPlanId] = useState<string | null>(initial[0]?.id ?? null);
  const plan = plans.find((p) => p.id === planId) ?? null;

  const candidates = useMemo(() => (plan ? scoreCandidates(growers, plan.order.restaurant) : []), [growers, plan]);
  const [assignments, setAssignments] = useState<Record<string, number>>(() => (initial[0] ? proposeAllocation(scoreCandidates(growers, initial[0].order.restaurant), initial[0].totalTrays) : {}));
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sending, setSending] = useState(false);

  const cities = useMemo(() => Array.from(new Set(growers.map((g) => g.city))).sort(), [growers]);
  const check = plan ? checkAllocation(assignments, candidates, plan.totalTrays) : null;
  const nearestId = candidates.filter((c) => c.distanceKm !== null).sort((a, b) => a.distanceKm! - b.distanceKm!)[0]?.id;

  const visible = candidates.filter(
    (c) =>
      (city === "all" || c.city === city) &&
      (!verifiedOnly || c.fssaiVerified) &&
      c.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  function choose(next: AllocatablePlan) {
    setPlanId(next.id);
    setAssignments(proposeAllocation(scoreCandidates(growers, next.order.restaurant), next.totalTrays));
  }

  async function send() {
    if (!plan || !check?.ok) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          allocations: Object.entries(assignments)
            .filter(([, trayCount]) => trayCount > 0)
            .map(([growerId, trayCount]) => ({ growerId, trayCount })),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error || `Could not send the tasks (${res.status})`);
        return;
      }
      toast.success("Tasks sent", { description: `Growers have been told what to sow for ${plan.order.restaurant.businessName}.` });
      const remaining = plans.filter((p) => p.id !== plan.id);
      setPlans(remaining);
      if (remaining[0]) choose(remaining[0]);
      else {
        setPlanId(null);
        setAssignments({});
      }
      router.refresh();
    } catch {
      toast.error("Network error. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (plans.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No plans waiting for growers"
        description="Create a production plan in the Demand engine first."
        action={
          <Link href="/admin/demand" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-ink">
            Open the Demand engine
          </Link>
        }
      />
    );
  }

  return (
    <DetailLayout
      asidePosition="left"
      aside={
        <Panel padding="none" className="overflow-hidden lg:sticky lg:top-24">
          <div className="px-4 pt-4">
            <PanelHeader title="Plans" subtitle={`${plans.length} waiting`} />
          </div>
          <ul className="divide-y divide-hairline/70">
            {plans.map((p) => {
              const urgency = urgencyOf(p.order.deliveryDate);
              const active = p.id === planId;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    data-no-global-loading
                    aria-pressed={active}
                    onClick={() => choose(p)}
                    className={cn("block w-full px-4 py-3 text-left transition-colors hover:bg-inset/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50", active && "bg-leaf-soft/60")}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{p.order.restaurant.businessName}</span>
                        <span className="block text-micro text-ink-muted">{`${cropName(p.order.cropType)}, ${p.order.quantityKg} kg`}</span>
                      </span>
                      <span className="shrink-0 text-sm font-medium tabular-nums text-ink">{`${p.totalTrays} trays`}</span>
                    </span>
                    <span className="mt-1.5 block">
                      <StatusChip tone={URGENCY_TONE[urgency.level]} label={urgency.level === "overdue" ? `${-urgency.days} days overdue` : `Delivery in ${urgency.days} days`} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      }
    >
      {plan && check ? (
        <Panel>
          <PanelHeader
            title={plan.order.restaurant.businessName}
            subtitle={`${cropName(plan.order.cropType)}, ${plan.order.quantityKg} kg · ${shortId(plan.id)}`}
            actions={
              <button
                type="button"
                data-no-global-loading
                onClick={() => setAssignments(proposeAllocation(candidates, plan.totalTrays))}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-panel/60 px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                <Target className="h-4 w-4" aria-hidden="true" />
                Auto-allocate
              </button>
            }
          />

          <dl className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["Trays needed", `${plan.totalTrays} (${plan.bufferTrays} buffer)`],
              ["Sow from", format(plan.sowDate, "d MMM")],
              ["Harvest", format(plan.harvestDate, "d MMM")],
              ["Delivery", format(plan.order.deliveryDate, "d MMM")],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-micro text-ink-muted">{label}</dt>
                <dd className="font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mb-4">
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="text-ink-soft">Assigned</span>
              <span className={cn("font-medium tabular-nums", check.ok ? "text-good" : check.assigned > plan.totalTrays ? "text-risk" : "text-ink")}>{`${check.assigned} of ${plan.totalTrays} trays`}</span>
            </div>
            <Meter size="thick" value={check.assigned} max={plan.totalTrays} tone={check.ok ? "leaf" : check.assigned > plan.totalTrays ? "risk" : "brand"} label="Trays assigned" />
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SearchPill value={query} onChange={setQuery} placeholder="Search growers" ariaLabel="Search growers" className="min-w-[10rem] flex-1" />
            <select aria-label="City" value={city} onChange={(e) => setCity(e.target.value)} className={cn(controlClass, "!w-auto !py-2 text-sm")}>
              <option value="all">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--c-brand))]" />
              FSSAI verified only
            </label>
          </div>

          {visible.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">No growers match.</p>
          ) : (
            <ul className="divide-y divide-hairline/70">
              {visible.map((c) => {
                const given = assignments[c.id] ?? 0;
                const over = check.overCapacity.includes(c.id);
                return (
                  <li key={c.id} className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3", c.free === 0 && "opacity-60")}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-ink">{c.name}</span>
                        {c.id === nearestId ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-leaf-soft px-2 py-0.5 text-micro font-medium text-ink">
                            <Navigation className="h-3 w-3" aria-hidden="true" />
                            Nearest
                          </span>
                        ) : null}
                        {c.fssaiVerified ? <ShieldCheck className="h-4 w-4 text-good" aria-label="FSSAI verified" /> : null}
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-micro text-ink-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {c.distanceKm === null ? c.city : `${c.city}, ${c.distanceKm.toFixed(1)} km`}
                        </span>
                        <span>{`Score ${Math.round(c.compositeScore * 100)}%`}</span>
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Meter value={c.activeTrays + given} max={Math.max(c.kitSize, 1)} tone={over ? "risk" : "leaf"} label={`${c.name} kit use`} className="max-w-[10rem]" />
                        <span className={cn("text-micro tabular-nums", over ? "font-medium text-risk" : "text-ink-muted")}>{`${c.free} of ${c.kitSize} trays free`}</span>
                      </div>
                      {over ? (
                        <p role="alert" className="mt-1 inline-flex items-center gap-1 text-micro font-medium text-risk">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          {`Only room for ${c.free}`}
                        </p>
                      ) : null}
                    </div>
                    <label className="flex flex-col items-end gap-1 text-micro text-ink-muted">
                      <span>Trays</span>
                      <input
                        type="number"
                        min={0}
                        max={c.free}
                        inputMode="numeric"
                        value={given}
                        disabled={c.free === 0}
                        aria-label={`Trays for ${c.name}`}
                        onChange={(e) => setAssignments((current) => ({ ...current, [c.id]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))}
                        className={cn(controlClass, "!w-20 !px-3 !py-2 text-center tabular-nums", over && "border-risk")}
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline/70 pt-4">
            <p className="text-sm text-ink-soft" aria-live="polite">
              {check.ok
                ? "Ready to send."
                : check.overCapacity.length > 0
                  ? "Someone has more trays than their kit holds."
                  : check.remaining > 0
                    ? `${check.remaining} trays still need a grower.`
                    : `${-check.remaining} trays too many.`}
            </p>
            <button
              type="button"
              data-no-global-loading
              onClick={send}
              disabled={!check.ok || sending}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
              Send tasks to growers
            </button>
          </div>
        </Panel>
      ) : null}
    </DetailLayout>
  );
}
