import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { InvoiceLink, invoiceHref } from "@/components/shared/InvoiceLink";
import { FilterChips } from "@/components/ui/filter-chips";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatTile } from "@/components/ui/stat-tile";
import { UrlSearch } from "@/components/ui/url-search";
import { PAYOUT_FILTERS, cropName, parsePayoutFilter, rupees, shortId, type PayoutFilter } from "@/lib/admin";
import { getAdminPayouts, getAdminSettlements } from "@/lib/admin-data";
import { PayoutsTable } from "./PayoutsTable";

const LABEL: Record<PayoutFilter, string> = { pending: "Pending", paid: "Paid", failed: "Failed" };

export default async function PayoutsPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const status = parsePayoutFilter(searchParams.status);
  const query = (searchParams.q ?? "").slice(0, 80).trim();
  const [{ rows, totals }, settlements] = await Promise.all([getAdminPayouts(status, query), getAdminSettlements()]);

  const counts: Record<PayoutFilter, number> = { pending: totals.pendingCount, paid: totals.paidCount, failed: totals.failedCount };
  const href = (value: string) => {
    const next = new URLSearchParams();
    if (value !== "pending") next.set("status", value);
    if (query) next.set("q", query);
    const qs = next.toString();
    return qs ? `/admin/payouts?${qs}` : "/admin/payouts";
  };

  return (
    <>
      <PageHeader
        title="Payouts"
        subtitle={totals.pendingCount > 0 ? `${rupees(totals.pendingAmount)} is waiting to be paid to growers.` : "Every grower has been paid."}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label="Pending" icon={<Clock />} value={rupees(totals.pendingAmount)} tone={totals.pendingAmount > 0 ? "watch" : "good"} caption={`${totals.pendingCount} ${totals.pendingCount === 1 ? "payout" : "payouts"} to pay`} />
        <StatTile label="Paid" icon={<CheckCircle2 />} value={rupees(totals.paidAmount)} caption={`${totals.paidCount} ${totals.paidCount === 1 ? "payout" : "payouts"} so far`} />
        {totals.failedCount > 0 ? <StatTile label="Failed" icon={<XCircle />} value={rupees(totals.failedAmount)} tone="watch" caption={`${totals.failedCount} to look at`} /> : null}
      </div>

      {settlements.length > 0 ? (
        <section aria-labelledby="settlements-heading" className="mt-6">
          <h2 id="settlements-heading" className="mb-3 text-base font-semibold text-ink">
            Order settlements
          </h2>
          <ul className="space-y-3">
            {settlements.map(({ order, growers, paidOut, share }) => (
              <li key={order.id}>
                <Panel>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        <span data-i18n-ignore>{order.restaurant.businessName}</span>
                        <span aria-hidden="true"> · </span>
                        <span data-i18n-ignore>{shortId(order.id)}</span>
                      </p>
                      <p className="text-micro text-ink-muted">{`${cropName(order.cropType)}, ${order.quantityKg} kg`}</p>
                      <dl className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <dt className="text-micro text-ink-muted">Billed</dt>
                          <dd className="font-medium tabular-nums text-ink">{rupees(order.totalPrice)}</dd>
                        </div>
                        <div>
                          <dt className="text-micro text-ink-muted">Growers</dt>
                          <dd className="font-medium tabular-nums text-ink">{rupees(paidOut)}</dd>
                        </div>
                        <div>
                          <dt className="text-micro text-ink-muted">SproutBox</dt>
                          <dd className="font-medium tabular-nums text-good">{rupees(share)}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <InvoiceLink href={invoiceHref.restaurant(order.id)} label="Restaurant invoice" size="sm" />
                      <InvoiceLink href={invoiceHref.platform(order.id)} label="Settlement" size="sm" />
                    </div>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-2 border-t border-hairline/70 pt-3">
                    {growers.map((g) => (
                      <li key={g.taskId}>
                        <InvoiceLink href={invoiceHref.grower(g.taskId)} label={`${g.name} · ${rupees(g.amount)}`} ariaLabel={`Download payout statement for ${g.name}`} size="sm" />
                      </li>
                    ))}
                  </ul>
                </Panel>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="payouts-heading" className="mt-6">
        <PanelHeader title={<span id="payouts-heading">Grower payouts</span>} className="!mb-3" />
        <FilterChips
          ariaLabel="Filter payouts"
          value={status}
          hrefFor={href}
          chips={PAYOUT_FILTERS.map((value) => ({ value, label: LABEL[value], count: counts[value] }))}
          className="mb-4"
        />
        <UrlSearch query={query} placeholder="Search by grower" ariaLabel="Search payouts" className="mb-5 max-w-sm" />
        <PayoutsTable rows={rows} selectable={status === "pending"} />
        {rows.length === 300 ? <p className="mt-3 text-center text-micro text-ink-muted">Showing the latest 300. Search by grower to narrow it down.</p> : null}
      </section>
    </>
  );
}
