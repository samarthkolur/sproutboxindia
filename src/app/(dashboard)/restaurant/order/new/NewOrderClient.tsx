"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AlertTriangle, Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { CheckoutModal, type PendingPayment } from "@/components/restaurant/CheckoutModal";
import { DetailLayout } from "@/components/ui/detail-layout";
import { controlClass, TextField } from "@/components/ui/field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  CROP_CYCLE_DAYS,
  CROP_DISPLAY_NAMES,
  CROP_IMAGES,
  CROP_PRICE_PER_KG,
  CROP_TYPES,
  type CropType,
} from "@/lib/constants";
import { trackPurchase } from "@/lib/gtag";
import {
  QUANTITY_STEP_KG,
  RECURRENCE_LABEL,
  cartTotal,
  fromDateInputValue,
  lineTotal,
  minDeliveryDate,
  minDeliveryDays,
  rupees,
  summarizeAttempts,
  toDateInputValue,
  type CartItem,
  type OrderAttempt,
  type PlacedOrder,
  type Recurrence,
} from "@/lib/restaurant";
import { cn } from "@/lib/utils";

const CADENCE = [
  { value: "once", label: "One time" },
  { value: "weekly", label: RECURRENCE_LABEL.weekly },
  { value: "biweekly", label: RECURRENCE_LABEL.biweekly },
];

export function NewOrderClient({ initialCart, initialRecurrence }: { initialCart: CartItem[]; initialRecurrence: Recurrence | null }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [cadence, setCadence] = useState<string>(initialRecurrence ?? "once");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | undefined>();
  const [placed, setPlaced] = useState<PlacedOrder[]>([]);
  const [payments, setPayments] = useState<PendingPayment[] | null>(null);

  const crops = cart.map((item) => item.cropType);
  const earliest = useMemo(() => minDeliveryDate(crops), [crops.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  const earliestValue = toDateInputValue(earliest);
  const total = cartTotal(cart);
  const leadDays = minDeliveryDays(crops);

  const change = (cropType: CropType, delta: number) =>
    setCart((current) => {
      const existing = current.find((item) => item.cropType === cropType);
      if (!existing) return delta > 0 ? [...current, { cropType, quantityKg: delta === QUANTITY_STEP_KG ? 1 : delta }] : current;
      return current
        .map((item) => (item.cropType === cropType ? { ...item, quantityKg: Math.max(0, item.quantityKg + delta) } : item))
        .filter((item) => item.quantityKg > 0);
    });

  async function submit() {
    setError(null);
    setDateError(undefined);
    if (cart.length === 0) return setError("Add at least one crop to your order.");
    if (!deliveryDate) return setDateError("Choose a delivery date.");
    if (deliveryDate < earliestValue) return setDateError(`The earliest delivery for this order is ${format(earliest, "d MMM")}.`);

    setSubmitting(true);
    try {
      // One order per crop. A failed line stays in the cart; the ones that went through leave it.
      const attempts: OrderAttempt[] = await Promise.all(
        cart.map(async (item) => {
          try {
            const res = await fetch("/api/restaurant/order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cropType: item.cropType,
                quantityKg: item.quantityKg,
                deliveryDate: fromDateInputValue(deliveryDate),
                recurrence: cadence === "once" ? null : cadence,
                notes: notes.trim() || undefined,
              }),
            });
            const body = await res.json().catch(() => null);
            return res.ok ? { ok: true, data: body?.data } : { ok: false };
          } catch {
            return { ok: false };
          }
        })
      );

      const result = summarizeAttempts(cart, attempts);
      if (result.placed.length === 0) {
        setError("We could not place your order. Nothing was charged. Please try again.");
        return;
      }

      setCart(result.failed);
      setPlaced((current) => [...current, ...result.placed]);

      if (result.awaitingPayment.length > 0) {
        setPayments(
          result.awaitingPayment.map((p) => ({
            orderId: p.orderId,
            clientSecret: p.clientSecret!,
            label: `${CROP_DISPLAY_NAMES[p.item.cropType]}, ${p.item.quantityKg} kg`,
            amount: p.totalPrice,
            cropType: p.item.cropType,
            quantityKg: p.item.quantityKg,
          }))
        );
      } else {
        // No payment provider configured: the orders were confirmed straight away.
        result.placed.forEach((p) => trackPurchase({ transactionId: p.orderId, value: p.totalPrice, cropType: p.item.cropType, quantityKg: p.item.quantityKg }));
        if (result.failed.length === 0) goToOrders();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function goToOrders() {
    router.push("/restaurant/orders");
    router.refresh();
  }

  function paymentFinished(paid: boolean) {
    if (paid) {
      payments?.forEach((p) => trackPurchase({ transactionId: p.orderId, value: p.amount, cropType: p.cropType, quantityKg: p.quantityKg }));
    }
    setPayments(null);
    // A cancelled checkout leaves the orders awaiting payment, to be paid from Orders.
    if (cart.length === 0) goToOrders();
  }

  const failedLabels = cart.map((item) => CROP_DISPLAY_NAMES[item.cropType]);

  return (
    <>
      {placed.length > 0 && cart.length > 0 ? (
        <div role="alert" className="mb-4 flex gap-3 rounded-panel bg-watch-soft/80 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-watch" aria-hidden="true" />
          <div className="min-w-0 text-sm">
            <p className="font-medium text-ink">{`${placed.length} ${placed.length === 1 ? "order was" : "orders were"} placed, but not everything went through`}</p>
            <p className="mt-0.5 text-ink-soft">{`Still in your cart: ${failedLabels.join(", ")}. Press Place order to try again.`}</p>
            <Link href="/restaurant/orders" className="mt-1.5 inline-block font-medium text-ink underline underline-offset-2">
              See the orders already placed
            </Link>
          </div>
        </div>
      ) : null}

      <DetailLayout
        aside={
          <Panel className="lg:sticky lg:top-24">
            <PanelHeader
              title="Your order"
              actions={cart.length > 0 ? <span className="rounded-full bg-leaf-soft px-2.5 py-0.5 text-micro font-medium text-ink">{`${cart.length} ${cart.length === 1 ? "item" : "items"}`}</span> : null}
            />

            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-inset text-ink-muted">
                  <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-ink">Your order is empty</p>
                <p className="mx-auto mt-1 max-w-[16rem] text-micro text-ink-muted">Choose a crop on the left to start.</p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-hairline/70">
                  {cart.map((item) => (
                    <li key={item.cropType} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{CROP_DISPLAY_NAMES[item.cropType]}</p>
                        <p className="text-micro text-ink-muted">{`${item.quantityKg} kg × ${rupees(CROP_PRICE_PER_KG[item.cropType])}`}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium tabular-nums text-ink">{rupees(lineTotal(item))}</span>
                        <button
                          type="button"
                          data-no-global-loading
                          onClick={() => setCart((current) => current.filter((c) => c.cropType !== item.cropType))}
                          aria-label={`Remove ${CROP_DISPLAY_NAMES[item.cropType]}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-risk-soft hover:text-risk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 space-y-4 border-t border-hairline/70 pt-4">
                  <TextField
                    label="Delivery date"
                    type="date"
                    min={earliestValue}
                    value={deliveryDate}
                    onChange={(event) => {
                      setDeliveryDate(event.target.value);
                      setDateError(undefined);
                    }}
                    error={dateError}
                  />
                  <p className="-mt-2 text-micro text-ink-muted">
                    <span>Earliest delivery </span>
                    <time>{format(earliest, "d MMM")}</time>
                    <span className="block">{`${leadDays} days: the slowest crop's grow time plus 2 to harvest and deliver.`}</span>
                  </p>

                  <div>
                    <p className="mb-1.5 text-sm font-medium text-ink">Repeat</p>
                    <SegmentedControl ariaLabel="Repeat" options={CADENCE} value={cadence} onChange={setCadence} />
                    {cadence !== "once" ? (
                      <p className="mt-1.5 text-micro text-ink-muted">We note how often you want this. Repeat orders are not placed for you yet, so order again when you need the next one.</p>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="order-notes" className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink">
                      <span>Notes</span>
                      <span className="text-micro font-normal text-ink-muted">Optional</span>
                    </label>
                    <textarea
                      id="order-notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      rows={2}
                      maxLength={1000}
                      placeholder="Delivery instructions or anything we should know"
                      className={cn(controlClass, "resize-none")}
                    />
                  </div>
                </div>

                <div className="mt-4 border-t border-hairline/70 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink-soft">Total</span>
                    <span className="text-2xl font-light tabular-nums text-ink">{rupees(total)}</span>
                  </div>

                  {error ? (
                    <p role="alert" className="mt-3 rounded-tile bg-risk-soft px-3 py-2 text-sm font-medium text-risk">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    data-no-global-loading
                    onClick={submit}
                    disabled={submitting}
                    className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-base font-medium text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Placing order…
                      </>
                    ) : (
                      "Place order"
                    )}
                  </button>
                </div>
              </>
            )}
          </Panel>
        }
      >
        <ul className="grid gap-4 min-[520px]:grid-cols-2">
          {CROP_TYPES.map((crop) => {
            const item = cart.find((c) => c.cropType === crop);
            return (
              <li key={crop}>
                <Panel padding="none" className="flex h-full flex-col overflow-hidden">
                  <div className="relative h-36 bg-inset">
                    <Image src={CROP_IMAGES[crop]} alt={CROP_DISPLAY_NAMES[crop]} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                    <span className="absolute right-3 top-3 rounded-full bg-panel-solid/90 px-2.5 py-1 text-micro font-medium text-ink shadow-panel">{`${CROP_CYCLE_DAYS[crop]} days to grow`}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="text-base font-medium text-ink">{CROP_DISPLAY_NAMES[crop]}</h2>
                      <p className="shrink-0 text-base font-medium tabular-nums text-ink">
                        {rupees(CROP_PRICE_PER_KG[crop])}
                        <span className="text-micro font-normal text-ink-muted"> /kg</span>
                      </p>
                    </div>
                    <p className="mt-1 flex-1 text-micro text-ink-muted">Grown to order, harvested fresh and delivered on your date.</p>

                    {item ? (
                      <div className="mt-3 flex items-center justify-between rounded-full border border-hairline bg-inset/50 p-1">
                        <button
                          type="button"
                          data-no-global-loading
                          onClick={() => change(crop, -QUANTITY_STEP_KG)}
                          aria-label={`Remove half a kilo of ${CROP_DISPLAY_NAMES[crop]}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-panel-solid text-ink shadow-panel transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span aria-live="polite" className="text-sm font-medium tabular-nums text-ink">{`${item.quantityKg} kg`}</span>
                        <button
                          type="button"
                          data-no-global-loading
                          onClick={() => change(crop, QUANTITY_STEP_KG)}
                          aria-label={`Add half a kilo of ${CROP_DISPLAY_NAMES[crop]}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-panel-solid text-ink shadow-panel transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-no-global-loading
                        onClick={() => change(crop, QUANTITY_STEP_KG)}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-hairline bg-panel/70 py-2 text-sm font-medium text-ink transition-colors hover:bg-inset/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        {`Add ${CROP_DISPLAY_NAMES[crop]}`}
                      </button>
                    )}
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
      </DetailLayout>

      {payments ? <CheckoutModal payments={payments} onComplete={() => paymentFinished(true)} onCancel={() => paymentFinished(false)} /> : null}
    </>
  );
}
