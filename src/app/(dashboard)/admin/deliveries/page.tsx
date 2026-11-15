import Link from "next/link";
import { format } from "date-fns";
import { Truck } from "lucide-react";
import { DeliveryActions } from "@/components/admin/DeliveryActions";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FilterChips } from "@/components/ui/filter-chips";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { DELIVERY_FILTERS, cropName, isLate, parseDeliveryFilter, shortId, type DeliveryFilter } from "@/lib/admin";
import { getAdminDeliveries } from "@/lib/admin-data";
import { cn } from "@/lib/utils";

type Row = Awaited<ReturnType<typeof getAdminDeliveries>>["deliveries"][number];

const LABEL: Record<DeliveryFilter, string> = { all: "All", PREPARING: "Preparing", PACKED: "Packed", IN_TRANSIT: "In transit", DELIVERED: "Delivered", FAILED: "Failed" };
const STEPS = ["PREPARING", "PACKED", "IN_TRANSIT", "DELIVERED"];

// Four segments, filled up to the current step. A failed delivery shows none, and says so with its chip.
function Progress({ status }: { status: string }) {
  const at = STEPS.indexOf(status);
  return (
    <span aria-hidden="true" className="flex w-24 gap-1">
      {STEPS.map((step, i) => (
        <span key={step} className={cn("h-1.5 flex-1 rounded-full", i <= at ? "bg-leaf" : "bg-inset")} />
      ))}
    </span>
  );
}

function columns(now: Date): Column<Row>[] {
  return [
    {
      key: "order",
      header: "Order",
      mobile: "title",
      cell: (d) => (
        <>
          <span data-i18n-ignore>{d.order.restaurant.businessName}</span>
          <span className="block text-micro font-normal text-ink-muted">{`${cropName(d.order.cropType)}, ${d.order.quantityKg} kg · ${shortId(d.order.id)}`}</span>
        </>
      ),
    },
    {
      key: "date",
      header: "Delivery date",
      cell: (d) => (
        <span className="inline-flex flex-wrap items-center gap-2">
          <time dateTime={d.order.deliveryDate.toISOString()}>{format(d.order.deliveryDate, "d MMM yyyy")}</time>
          {isLate(d, d.order.deliveryDate, now) ? <StatusChip tone="risk" label="Late" /> : null}
        </span>
      ),
    },
    { key: "hub", header: "Hub", cell: (d) => <span data-i18n-ignore>{d.hub.name}</span> },
    {
      key: "status",
      header: "Status",
      cell: (d) => (
        <span className="flex flex-col items-start gap-1.5">
          <StatusChip status={d.status} />
          <Progress status={d.status} />
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (d) => <DeliveryActions deliveryId={d.id} status={d.status} label={`${d.order.restaurant.businessName}, ${shortId(d.order.id)}`} />,
    },
  ];
}

export default async function AdminDeliveriesPage({ searchParams }: { searchParams: { status?: string; limit?: string } }) {
  const status = parseDeliveryFilter(searchParams.status);
  const limit = Math.min(200, Math.max(20, Math.floor(Number(searchParams.limit) / 20) * 20 || 20));
  const { deliveries, hasMore, counts } = await getAdminDeliveries(status, limit);
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const now = new Date();

  const href = (value: string, nextLimit?: number) => {
    const next = new URLSearchParams();
    if (value !== "all") next.set("status", value);
    if (nextLimit && nextLimit > 20) next.set("limit", String(nextLimit));
    const qs = next.toString();
    return qs ? `/admin/deliveries?${qs}` : "/admin/deliveries";
  };

  return (
    <>
      <PageHeader title="Deliveries" subtitle="Every delivery from the hub to the restaurant. Move each one along as it happens." />
      {total === 0 ? (
        <EmptyState icon={Truck} title="No deliveries yet" description="A delivery appears here once an order's trays reach the hub." />
      ) : (
        <>
          <FilterChips
            ariaLabel="Filter deliveries"
            value={status}
            hrefFor={(value) => href(value)}
            chips={DELIVERY_FILTERS.map((value) => ({ value, label: LABEL[value], count: value === "all" ? total : counts[value] ?? 0 }))}
            className="mb-5"
          />
          <DataTable
            caption="Deliveries"
            columns={columns(now)}
            rows={deliveries}
            rowKey={(d) => d.id}
            empty={<EmptyState icon={Truck} title="No deliveries with this status" description="Choose another status to see more." />}
          />
          {hasMore ? (
            <div className="mt-4 text-center">
              <Link href={href(status, limit + 20)} scroll={false} className="inline-flex rounded-full border border-hairline bg-panel/60 px-5 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink">
                Load more
              </Link>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
