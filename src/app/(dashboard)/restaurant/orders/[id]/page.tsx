import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ChevronRight, Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { PayNowButton } from "@/components/restaurant/PayNowButton";
import { InvoiceLink, invoiceHref } from "@/components/shared/InvoiceLink";
import { DetailLayout } from "@/components/ui/detail-layout";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Ring } from "@/components/ui/ring";
import { StatusChip } from "@/components/ui/status-chip";
import { Timeline } from "@/components/ui/timeline";
import { CROP_DISPLAY_NAMES, CROP_IMAGES, type CropType } from "@/lib/constants";
import { isInvoiceable } from "@/lib/invoices";
import { RECURRENCE_LABEL, growthProgress, orderTimeline, parseFeedbackNotes, parseRecurrence, rupees, shortId, stageIndex } from "@/lib/restaurant";
import { getRestaurantOrder } from "@/lib/restaurant-data";

const STEP_COPY: Record<string, string> = {
  CONFIRMED: "Your order is booked.",
  IN_PRODUCTION: "Growers are growing your crop.",
  AT_HUB: "Harvested, checked and packed at our hub.",
  IN_TRANSIT: "On its way to your kitchen.",
  DELIVERED: "Delivered to your kitchen.",
};

export default async function RestaurantOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const order = await getRestaurantOrder(session?.user?.id ?? "", params.id);
  if (!order) notFound();

  const name = CROP_DISPLAY_NAMES[order.cropType as CropType] ?? order.cropType;
  const image = CROP_IMAGES[order.cropType as CropType];
  const awaitingPayment = order.status === "PENDING_PAYMENT";
  const cancelled = order.status === "CANCELLED";
  const reached = stageIndex(order);
  const progress = growthProgress(order, reached);
  const steps = orderTimeline(order);
  const recurrence = parseRecurrence(order.recurrence);
  const given = order.feedback ? parseFeedbackNotes(order.feedback.notes) : null;
  const rate = Math.round(order.totalPrice / order.quantityKg);

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-ink-muted">
        <Link href="/restaurant/orders" className="rounded hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
          My orders
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span aria-current="page" className="font-medium text-ink">
          {`Order ${shortId(order.id)}`}
        </span>
      </nav>

      <DetailLayout
        aside={
          <>
            <Panel>
              <PanelHeader title="Order details" />
              <dl className="space-y-3 text-sm">
                {[
                  ["Quantity", `${order.quantityKg} kg`],
                  ["Price", `${rupees(rate)} per kg`],
                  ["Total", rupees(order.totalPrice)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-muted">{label}</dt>
                    <dd className="font-medium tabular-nums text-ink">{value}</dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">Placed</dt>
                  <dd className="font-medium text-ink"><time dateTime={order.createdAt.toISOString()}>{format(order.createdAt, "d MMM yyyy")}</time></dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-muted">Delivery date</dt>
                  <dd className="font-medium text-ink"><time dateTime={order.deliveryDate.toISOString()}>{format(order.deliveryDate, "d MMM yyyy")}</time></dd>
                </div>
                {order.delivery?.deliveredAt ? (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-muted">Delivered on</dt>
                    <dd className="font-medium text-ink"><time dateTime={order.delivery.deliveredAt.toISOString()}>{format(order.delivery.deliveredAt, "d MMM yyyy")}</time></dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-muted">Payment</dt>
                  <dd>
                    <StatusChip status={awaitingPayment ? "PENDING_PAYMENT" : cancelled ? "CANCELLED" : "PAID"} />
                  </dd>
                </div>
                {recurrence ? (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-ink-muted">Repeat</dt>
                    <dd className="font-medium text-ink">{RECURRENCE_LABEL[recurrence]}</dd>
                  </div>
                ) : null}
              </dl>
              {order.notes ? (
                <div className="mt-4 rounded-tile bg-inset/60 p-3">
                  <p className="text-micro font-medium text-ink-muted">Your notes</p>
                  <p className="mt-0.5 whitespace-pre-line text-sm text-ink-soft">{order.notes}</p>
                </div>
              ) : null}
            </Panel>

            <Panel>
              <PanelHeader title="Actions" />
              <div className="flex flex-col items-stretch gap-2">
                {awaitingPayment ? (
                  <PayNowButton orderId={order.id} amount={order.totalPrice} cropType={order.cropType} quantityKg={order.quantityKg} label={`${name}, ${order.quantityKg} kg`} className="w-full" />
                ) : null}
                {isInvoiceable(order.status) ? <InvoiceLink href={invoiceHref.restaurant(order.id)} label="Download invoice" className="justify-center" /> : null}
                {order.status === "DELIVERED" && !order.feedback ? (
                  <Link href={`/restaurant/feedback/${order.id}`} className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90">
                    Leave feedback
                  </Link>
                ) : null}
                <Link href="/restaurant/order/new" className="inline-flex items-center justify-center rounded-full border border-hairline bg-panel/60 px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink">
                  Order again
                </Link>
              </div>
            </Panel>

            {order.feedback && given ? (
              <Panel>
                <PanelHeader title="Your feedback" />
                <p className="flex items-center gap-0.5" role="img" aria-label={`Rated ${order.feedback.rating} of 5`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={n <= order.feedback!.rating ? "h-5 w-5 fill-watch text-watch" : "h-5 w-5 text-hairline"} aria-hidden="true" />
                  ))}
                </p>
                {given.tags.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {given.tags.map((tag) => (
                      <li key={tag} className="rounded-full bg-leaf-soft px-3 py-1 text-micro font-medium text-ink">{tag}</li>
                    ))}
                  </ul>
                ) : null}
                {given.text ? <p className="mt-3 text-sm text-ink-soft">{given.text}</p> : null}
                <Link href={`/restaurant/feedback/${order.id}`} className="mt-3 inline-block text-sm font-medium text-ink underline underline-offset-2">
                  Edit feedback
                </Link>
              </Panel>
            ) : null}
          </>
        }
      >
        <Panel padding="none" className="overflow-hidden">
          {image ? (
            <div className="relative h-44 bg-inset sm:h-56">
              <Image src={image} alt={name} fill priority sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-light tracking-tight text-ink sm:text-3xl">{name}</h1>
                <StatusChip status={order.status} />
              </div>
              <p className="mt-1.5 text-sm text-ink-soft">{`${order.quantityKg} kg · ${shortId(order.id)}`}</p>
              {reached === 1 ? <p className="mt-0.5 text-sm text-ink-soft">{`Day ${progress.day} of ${progress.totalDays}`}</p> : null}
            </div>
            {!cancelled && !awaitingPayment ? (
              <Ring percent={progress.percent} size={96} label={`${progress.percent}% grown`}>
                <span className="text-2xl font-light tabular-nums text-ink">{`${progress.percent}%`}</span>
                <span className="text-micro text-ink-muted">grown</span>
              </Ring>
            ) : null}
          </div>
        </Panel>

        {awaitingPayment ? (
          <div role="status" className="rounded-panel bg-watch-soft/80 p-4 text-sm text-ink">
            <p className="font-medium">Waiting for payment</p>
            <p className="mt-0.5 text-ink-soft">We start growing as soon as the payment arrives. You can pay now from the actions on this page.</p>
          </div>
        ) : null}
        {cancelled ? (
          <div role="status" className="rounded-panel bg-risk-soft p-4 text-sm text-risk">
            <p className="font-medium">This order was cancelled</p>
          </div>
        ) : null}

        {!cancelled ? (
          <Panel>
            <PanelHeader title="Where your order is" subtitle="From booking to your kitchen" />
            <Timeline
              items={steps.map((step) => ({
                key: step.key,
                title: step.title,
                description: STEP_COPY[step.key],
                state: step.state,
                meta: step.at ? <time dateTime={step.at.toISOString()}>{format(step.at, "d MMM")}</time> : undefined,
              }))}
            />
          </Panel>
        ) : null}
      </DetailLayout>
    </>
  );
}
