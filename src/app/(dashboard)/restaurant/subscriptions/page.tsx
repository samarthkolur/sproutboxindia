import Link from "next/link";
import { format } from "date-fns";
import { Info, RotateCw } from "lucide-react";
import { auth } from "@/lib/auth";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { CROP_DISPLAY_NAMES, type CropType } from "@/lib/constants";
import { RECURRENCE_LABEL, parseRecurrence, rupees, shortId } from "@/lib/restaurant";
import { getRestaurantOrders } from "@/lib/restaurant-data";

// Orders placed with a repeat preference. Nothing in the backend places the repeat orders yet,
// so this page lists what was asked for and offers "Order again", and says plainly that it
// does not run on its own.
export default async function SubscriptionsPage() {
  const session = await auth();
  const restaurant = await getRestaurantOrders(session?.user?.id ?? "");
  const repeats = (restaurant?.orders ?? [])
    .filter((order) => order.status !== "CANCELLED" && parseRecurrence(order.recurrence))
    .map((order) => ({ order, recurrence: parseRecurrence(order.recurrence)! }));

  return (
    <>
      <PageHeader title="Repeat orders" subtitle="The crops you want on a regular schedule." />

      <div className="mb-4 flex gap-3 rounded-panel bg-inset/60 p-4 text-sm text-ink-soft">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
        <p>We note how often you want each crop. Repeat orders are not placed for you yet, so use Order again when you need the next delivery.</p>
      </div>

      {repeats.length === 0 ? (
        <EmptyState
          icon={RotateCw}
          title="No repeat orders yet"
          description="Choose Weekly or Every 2 weeks when you place an order and it will be listed here."
          action={
            <Link href="/restaurant/order/new?recurrence=weekly" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-ink">
              Set up a repeat order
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {repeats.map(({ order, recurrence }) => {
            const name = CROP_DISPLAY_NAMES[order.cropType as CropType] ?? order.cropType;
            return (
              <li key={order.id}>
                <Panel className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base font-medium text-ink">{name}</h2>
                      <p className="mt-0.5 text-sm text-ink-soft">{`${order.quantityKg} kg · ${rupees(order.totalPrice)}`}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-leaf-soft px-3 py-1 text-micro font-medium text-ink">{RECURRENCE_LABEL[recurrence]}</span>
                  </div>
                  <p className="mt-3 flex-1 text-micro text-ink-muted">
                    <span>First order </span>
                    <Link href={`/restaurant/orders/${order.id}`} className="underline underline-offset-2">{shortId(order.id)}</Link>
                    <span>, delivered on </span>
                    <time dateTime={order.deliveryDate.toISOString()}>{format(order.deliveryDate, "d MMM yyyy")}</time>
                  </p>
                  <Link
                    href={`/restaurant/order/new?crop=${order.cropType}&kg=${order.quantityKg}&recurrence=${recurrence}`}
                    className="mt-4 inline-flex items-center justify-center gap-2 self-start rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90"
                  >
                    Order again
                  </Link>
                </Panel>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
