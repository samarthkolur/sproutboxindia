import Link from "next/link";
import { format } from "date-fns";
import { Package, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { OrdersToolbar } from "@/components/restaurant/OrdersToolbar";
import { PayNowButton } from "@/components/restaurant/PayNowButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { InvoiceLink, invoiceHref } from "@/components/shared/InvoiceLink";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FilterChips } from "@/components/ui/filter-chips";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { CROP_DISPLAY_NAMES, type CropType } from "@/lib/constants";
import { isInvoiceable } from "@/lib/invoices";
import {
  ORDER_FILTERS,
  orderFilterOf,
  parseOrderFilter,
  parseOrderSort,
  rupees,
  searchOrders,
  shortId,
  sortOrders,
  type OrderFilter,
} from "@/lib/restaurant";
import { getRestaurantOrders, type RestaurantOrder } from "@/lib/restaurant-data";

const cropName = (crop: string) => CROP_DISPLAY_NAMES[crop as CropType] ?? crop;

const FILTER_LABEL: Record<OrderFilter, string> = {
  all: "All",
  awaiting: "Awaiting payment",
  production: "In production",
  transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const COLUMNS: Column<RestaurantOrder>[] = [
  {
    key: "order",
    header: "Order",
    mobile: "title",
    cell: (order) => (
      <>
        {cropName(order.cropType)}
        <span className="block text-micro font-normal text-ink-muted">{`${shortId(order.id)} · ${order.quantityKg} kg`}</span>
      </>
    ),
  },
  { key: "placed", header: "Placed", cell: (order) => <time dateTime={order.createdAt.toISOString()}>{format(order.createdAt, "d MMM yyyy")}</time> },
  { key: "delivery", header: "Delivery", cell: (order) => <time dateTime={order.deliveryDate.toISOString()}>{format(order.deliveryDate, "d MMM yyyy")}</time> },
  { key: "status", header: "Status", cell: (order) => <StatusChip status={order.status} /> },
  { key: "amount", header: "Amount", align: "right", cell: (order) => <span className="font-medium text-ink">{rupees(order.totalPrice)}</span> },
  {
    key: "actions",
    header: "Actions",
    align: "right",
    cell: (order) => (
      // Above the row's stretched link, so each action stays clickable.
      <span className="relative z-10 inline-flex flex-wrap items-center justify-end gap-2">
        {order.status === "PENDING_PAYMENT" ? (
          <PayNowButton orderId={order.id} amount={order.totalPrice} cropType={order.cropType} quantityKg={order.quantityKg} label={`${cropName(order.cropType)}, ${order.quantityKg} kg`} size="sm" />
        ) : null}
        {order.status === "DELIVERED" && !order.feedback ? (
          <Link href={`/restaurant/feedback/${order.id}`} aria-label={`Rate order ${shortId(order.id)}`} className="rounded-full border border-hairline bg-panel/60 px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink">
            Rate
          </Link>
        ) : null}
        {order.feedback ? <span className="text-sm text-ink-muted">{`Rated ${order.feedback.rating} of 5`}</span> : null}
        {isInvoiceable(order.status) ? (
          <InvoiceLink href={invoiceHref.restaurant(order.id)} label="Invoice" ariaLabel={`Download invoice for order ${shortId(order.id)}`} size="sm" />
        ) : null}
      </span>
    ),
  },
];

export default async function RestaurantOrdersPage({ searchParams }: { searchParams: { status?: string; q?: string; sort?: string } }) {
  const session = await auth();
  const restaurant = await getRestaurantOrders(session?.user?.id ?? "");
  const orders = restaurant?.orders ?? [];

  const status = parseOrderFilter(searchParams.status);
  const sort = parseOrderSort(searchParams.sort);
  const query = (searchParams.q ?? "").slice(0, 80);

  const href = (value: string) => {
    const next = new URLSearchParams();
    if (value !== "all") next.set("status", value);
    if (query) next.set("q", query);
    if (sort !== "newest") next.set("sort", sort);
    const qs = next.toString();
    return qs ? `/restaurant/orders?${qs}` : "/restaurant/orders";
  };

  const searched = searchOrders(orders, query, cropName);
  const count = (filter: OrderFilter) => (filter === "all" ? searched.length : searched.filter((o) => orderFilterOf(o.status) === filter).length);
  const shown = sortOrders(status === "all" ? searched : searched.filter((o) => orderFilterOf(o.status) === status), sort);
  const awaiting = orders.filter((o) => o.status === "PENDING_PAYMENT").length;

  return (
    <>
      <PageHeader
        title="My orders"
        subtitle={awaiting > 0 ? (awaiting === 1 ? "1 order is waiting for payment." : `${awaiting} orders are waiting for payment.`) : "Everything you have ordered, in one place."}
        actions={
          <Link href="/restaurant/order/new" className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90">
            New order
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Place your first microgreens order and we will start growing it for you."
          action={
            <Link href="/restaurant/order/new" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-ink">
              Place an order
            </Link>
          }
        />
      ) : (
        <>
          <FilterChips
            ariaLabel="Filter orders"
            value={status}
            hrefFor={href}
            chips={ORDER_FILTERS.map((value) => ({ value, label: FILTER_LABEL[value], count: count(value) }))}
            className="mb-4"
          />
          <OrdersToolbar query={query} sort={sort} />
          <DataTable
            caption="Orders"
            columns={COLUMNS}
            rows={shown}
            rowKey={(order) => order.id}
            rowHref={(order) => `/restaurant/orders/${order.id}`}
            rowLabel={(order) => `${cropName(order.cropType)}, order ${shortId(order.id)}`}
            empty={
              <EmptyState
                icon={Package}
                title="No orders match"
                description="Try another status or a different search."
                action={
                  <Link href="/restaurant/orders" className="rounded-full border border-hairline bg-panel/60 px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink">
                    Clear filters
                  </Link>
                }
              />
            }
          />
        </>
      )}
    </>
  );
}
