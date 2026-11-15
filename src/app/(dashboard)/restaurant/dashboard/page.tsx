import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Package, Plus, ShoppingBag, Star, Store, Wallet } from "lucide-react";
import { auth } from "@/lib/auth";
import { PayNowButton } from "@/components/restaurant/PayNowButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Ring } from "@/components/ui/ring";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusChip } from "@/components/ui/status-chip";
import { CROP_DISPLAY_NAMES, CROP_IMAGES, CROP_PRICE_PER_KG, CROP_TYPES, type CropType } from "@/lib/constants";
import { greetingFor } from "@/lib/grower";
import {
  averageRating,
  dashboardSentence,
  growthProgress,
  isActiveOrder,
  monthlySpend,
  nextDelivery,
  rupees,
  shortId,
} from "@/lib/restaurant";
import { getRestaurantOrders } from "@/lib/restaurant-data";

const cropName = (crop: string) => CROP_DISPLAY_NAMES[crop as CropType] ?? crop;

export default async function RestaurantDashboard() {
  const session = await auth();
  const restaurant = await getRestaurantOrders(session?.user?.id ?? "");
  const now = new Date();

  if (!restaurant) {
    return (
      <>
        <PageHeader title={greetingFor(now)} subtitle="Your restaurant profile is not set up yet." />
        <EmptyState
          icon={Store}
          title="No restaurant profile found"
          description="Finish joining as a restaurant and your orders will appear here."
          action={
            <Link href="/join/restaurant" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-ink">
              Join as a restaurant
            </Link>
          }
        />
      </>
    );
  }

  const { orders } = restaurant;
  const awaiting = orders.filter((order) => order.status === "PENDING_PAYMENT");
  const active = orders.filter((order) => isActiveOrder(order.status));
  const upcoming = nextDelivery(orders, now);
  const spend = monthlySpend(orders, now);
  const ordersThisMonth = orders.filter((o) => o.status !== "CANCELLED" && o.createdAt >= new Date(now.getFullYear(), now.getMonth(), 1)).length;
  const ratings = orders.flatMap((order) => (order.feedback ? [order.feedback.rating] : []));
  const rating = averageRating(ratings);
  const awaitingTotal = awaiting.reduce((sum, order) => sum + order.totalPrice, 0);
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;

  return (
    <>
      <PageHeader
        eyebrow={format(now, "EEEE, d MMMM")}
        title={greetingFor(now)}
        subtitle={dashboardSentence({
          awaitingPayment: awaiting.length,
          growing: active.length,
          nextDeliveryDay: upcoming ? format(upcoming.deliveryDate, "EEEE") : null,
        })}
        actions={
          <Link href="/restaurant/order/new" className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90">
            New order
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />

      {awaiting.length > 0 ? (
        <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-panel bg-watch-soft/80 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="text-base font-medium text-ink">{`${rupees(awaitingTotal)} is waiting to be paid`}</p>
            <p className="mt-0.5 text-sm text-ink-soft">We start growing as soon as the payment arrives.</p>
          </div>
          {awaiting.length === 1 ? (
            <PayNowButton
              orderId={awaiting[0].id}
              amount={awaiting[0].totalPrice}
              cropType={awaiting[0].cropType}
              quantityKg={awaiting[0].quantityKg}
              label={`${cropName(awaiting[0].cropType)}, ${awaiting[0].quantityKg} kg`}
            />
          ) : (
            <Link href="/restaurant/orders?status=awaiting" className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-ink">
              Review and pay
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Active orders"
          icon={<Package />}
          value={active.length}
          caption={active.length > 0 ? "Being grown or on the way" : "Nothing in progress"}
          href="/restaurant/orders?status=production"
        />
        <StatTile
          label="This month"
          icon={<Wallet />}
          value={rupees(spend.thisMonth)}
          caption={
            spend.change === null
              ? ordersThisMonth > 0
                ? `${ordersThisMonth} ${ordersThisMonth === 1 ? "order" : "orders"} this month`
                : "No orders this month"
              : `${spend.change > 0 ? "+" : ""}${spend.change}% vs last month`
          }
        />
        <StatTile
          label="Total orders"
          icon={<ShoppingBag />}
          value={orders.length}
          caption={orders.length > 0 ? `${delivered} delivered` : "Place your first order"}
          href="/restaurant/orders"
        />
        <StatTile
          label="Average rating"
          icon={<Star />}
          value={rating === null ? "—" : rating.toFixed(1)}
          tone={rating !== null && rating >= 4.5 ? "good" : "neutral"}
          caption={rating === null ? "No ratings yet. Rate a delivered order." : `From ${ratings.length} ${ratings.length === 1 ? "rating" : "ratings"}`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-5">
        <Panel className="min-w-0">
          <PanelHeader
            title="In progress"
            subtitle="Your orders on their way to the kitchen"
            actions={
              <Link href="/restaurant/orders" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
                View all
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
          {active.length > 0 ? (
            <ul className="divide-y divide-hairline/70">
              {active.slice(0, 4).map((order) => {
                const progress = growthProgress(order);
                return (
                  <li key={order.id} className="relative flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <Ring percent={progress.percent} size={56} strokeWidth={6} label={`${progress.percent}% grown`}>
                      <span className="text-sm font-medium tabular-nums text-ink">{`${progress.percent}%`}</span>
                    </Ring>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/restaurant/orders/${order.id}`} className="text-base font-medium text-ink after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand/50">
                          {cropName(order.cropType)}
                        </Link>
                        <StatusChip status={order.status} />
                      </div>
                      <p className="mt-0.5 text-sm text-ink-soft">{`${order.quantityKg} kg · ${shortId(order.id)}`}</p>
                      <p className="text-micro text-ink-muted">
                        <span>Delivery </span>
                        <time dateTime={order.deliveryDate.toISOString()}>{format(order.deliveryDate, "d MMM")}</time>
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium tabular-nums text-ink">{rupees(order.totalPrice)}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">
              Nothing is growing for you right now.{" "}
              <Link href="/restaurant/order/new" className="font-medium text-ink underline underline-offset-2">
                Place an order
              </Link>
            </p>
          )}
        </Panel>

        <section aria-labelledby="next-delivery" className="rounded-panel bg-brand p-5 text-brand-ink shadow-pop sm:p-6">
          <h2 id="next-delivery" className="text-lg font-medium">
            Next delivery
          </h2>
          {upcoming ? (
            <>
              <p className="mt-3 text-4xl font-light leading-none tracking-tight">{format(upcoming.deliveryDate, "EEE d MMM")}</p>
              <p className="mt-2 text-sm text-brand-ink/80">{`${cropName(upcoming.cropType)}, ${upcoming.quantityKg} kg`}</p>
              <Link
                href={`/restaurant/orders/${upcoming.id}`}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-ink px-4 py-2 text-sm font-medium text-brand transition-opacity hover:opacity-90"
              >
                View order
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-brand-ink/80">No delivery is scheduled. Place an order and pick a date.</p>
          )}
        </section>
      </div>

      <section aria-labelledby="catalog-heading" className="mt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="catalog-heading" className="text-base font-semibold text-ink">
            Order a crop
          </h2>
          <p className="text-sm text-ink-muted">Pick one to start a new order</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CROP_TYPES.map((crop) => (
            <li key={crop}>
              <Link
                href={`/restaurant/order/new?crop=${crop}`}
                className="group block overflow-hidden rounded-tile border border-white/50 bg-panel/55 shadow-panel transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                <div className="relative h-24 bg-inset">
                  <Image src={CROP_IMAGES[crop]} alt="" fill sizes="(min-width: 1024px) 15vw, 45vw" className="object-cover" />
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-ink">{CROP_DISPLAY_NAMES[crop]}</p>
                  <p className="mt-0.5 text-micro text-ink-muted">{`${rupees(CROP_PRICE_PER_KG[crop])} per kg`}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
