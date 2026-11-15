import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ChevronRight, Star } from "lucide-react";
import { InvoiceLink, invoiceHref } from "@/components/shared/InvoiceLink";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusChip } from "@/components/ui/status-chip";
import { cropName, restaurantActivity, rupees, shortId } from "@/lib/admin";
import { getAdminRestaurant } from "@/lib/admin-data";
import { isInvoiceable } from "@/lib/invoices";
import { averageRating, parseFeedbackNotes } from "@/lib/restaurant";

type Order = NonNullable<Awaited<ReturnType<typeof getAdminRestaurant>>>["orders"][number];

const COLUMNS: Column<Order>[] = [
  {
    key: "order",
    header: "Order",
    mobile: "title",
    cell: (o) => (
      <>
        {cropName(o.cropType)}
        <span className="block text-micro font-normal text-ink-muted">{`${shortId(o.id)} · ${o.quantityKg} kg`}</span>
      </>
    ),
  },
  { key: "placed", header: "Placed", cell: (o) => <time dateTime={o.createdAt.toISOString()}>{format(o.createdAt, "d MMM yyyy")}</time> },
  { key: "status", header: "Status", cell: (o) => <StatusChip status={o.status} /> },
  { key: "amount", header: "Amount", align: "right", cell: (o) => <span className="font-medium text-ink">{rupees(o.totalPrice)}</span> },
  {
    key: "invoice",
    header: "Invoice",
    align: "right",
    cell: (o) => (isInvoiceable(o.status) ? <span className="relative z-10 inline-flex"><InvoiceLink href={invoiceHref.restaurant(o.id)} label="Invoice" ariaLabel={`Download invoice for order ${shortId(o.id)}`} size="sm" /></span> : null),
  },
];

const ACTIVITY_CHIP = { active: { status: "ACTIVE" }, dormant: { status: "DORMANT" }, never: { label: "Never ordered", tone: "neutral" as const } };

export default async function AdminRestaurantDetailPage({ params }: { params: { restaurantId: string } }) {
  const restaurant = await getAdminRestaurant(params.restaurantId);
  if (!restaurant) notFound();

  const paid = restaurant.orders.filter((o) => o.status !== "PENDING_PAYMENT" && o.status !== "CANCELLED");
  const revenue = paid.reduce((sum, o) => sum + o.totalPrice, 0);
  const lastOrderAt = restaurant.orders[0]?.createdAt ?? null;
  const reviews = restaurant.orders.flatMap((o) => (o.feedback ? [{ order: o, feedback: o.feedback }] : []));
  const rating = averageRating(reviews.map((r) => r.feedback.rating));

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-ink-muted">
        <Link href="/admin/restaurants" className="rounded hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
          Restaurants
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span aria-current="page" className="font-medium text-ink" data-i18n-ignore>{restaurant.businessName}</span>
      </nav>

      <PageHeader
        title={<span data-i18n-ignore>{restaurant.businessName}</span>}
        subtitle={<span data-i18n-ignore>{`${restaurant.city}${restaurant.cuisineType ? ` · ${restaurant.cuisineType}` : ""}`}</span>}
        actions={<StatusChip {...ACTIVITY_CHIP[restaurantActivity(lastOrderAt)]} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Orders" value={restaurant.orders.length} caption={`${paid.length} paid`} />
        <StatTile label="Revenue" value={rupees(revenue)} caption="From paid orders" />
        <StatTile label="Average rating" value={rating === null ? "—" : rating.toFixed(1)} tone={rating !== null && rating >= 4.5 ? "good" : "neutral"} caption={rating === null ? "No ratings yet" : `From ${reviews.length} ${reviews.length === 1 ? "rating" : "ratings"}`} />
        <StatTile label="Last order" value={lastOrderAt ? format(lastOrderAt, "d MMM") : "—"} caption={lastOrderAt ? format(lastOrderAt, "yyyy") : "Has not ordered yet"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-5">
        <section aria-labelledby="history" className="min-w-0">
          <h2 id="history" className="mb-3 text-base font-semibold text-ink">
            Order history
          </h2>
          <DataTable
            caption="Order history"
            columns={COLUMNS}
            rows={restaurant.orders}
            rowKey={(o) => o.id}
            empty={<Panel><p className="text-sm text-ink-muted">This restaurant has not placed an order yet.</p></Panel>}
          />
        </section>

        <div className="min-w-0 space-y-4">
          <Panel>
            <PanelHeader title="Contact" />
            <dl className="space-y-3 text-sm">
              {[
                ["Contact", restaurant.contactName],
                ["Email", restaurant.user.email],
                ["Phone", restaurant.phone],
                ["Address", `${restaurant.address}, ${restaurant.city} ${restaurant.pincode}`],
                ...(restaurant.gstin ? [["GSTIN", restaurant.gstin]] : []),
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-micro text-ink-muted">{label}</dt>
                  <dd className="break-words font-medium text-ink" data-i18n-ignore>{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel>
            <PanelHeader title="Feedback" subtitle="What this kitchen said about deliveries" />
            {reviews.length > 0 ? (
              <ul className="space-y-4">
                {reviews.map(({ order, feedback }) => {
                  const note = parseFeedbackNotes(feedback.notes);
                  return (
                    <li key={feedback.id}>
                      <p className="flex items-center gap-0.5" role="img" aria-label={`Rated ${feedback.rating} of 5`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={n <= feedback.rating ? "h-4 w-4 fill-watch text-watch" : "h-4 w-4 text-hairline"} aria-hidden="true" />
                        ))}
                      </p>
                      <p className="mt-0.5 text-micro text-ink-muted">{`${cropName(order.cropType)} · ${shortId(order.id)}`}</p>
                      {note.tags.length > 0 ? (
                        <ul className="mt-1 flex flex-wrap gap-1.5">
                          {note.tags.map((tag) => (
                            <li key={tag} className="rounded-full bg-leaf-soft px-2.5 py-0.5 text-micro font-medium text-ink">{tag}</li>
                          ))}
                        </ul>
                      ) : null}
                      {note.text ? <p className="mt-1 text-sm text-ink-soft" data-i18n-ignore>{note.text}</p> : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No feedback yet.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
