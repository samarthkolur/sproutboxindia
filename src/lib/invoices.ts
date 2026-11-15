import { format } from "date-fns";
import { COMPANY } from "@/lib/company";
import { CROP_DISPLAY_NAMES, PAYOUT_PER_TRAY, type CropType } from "@/lib/constants";

// The documents the portals can download. Each builder turns rows from the database
// into one plain `InvoiceDoc`; the PDF renderer only draws what it is given, so every
// number on a page is decided, and tested, here.

export type InvoiceKind = "restaurant" | "grower" | "platform";

export interface Party {
  name: string;
  lines: string[];
}

export interface InvoiceRow {
  description: string;
  detail?: string;
  quantity: string;
  rate: string;
  amount: number;
}

export interface InvoiceDoc {
  kind: InvoiceKind;
  title: string;
  number: string;
  issuedOn: Date;
  status: { label: string; paid: boolean };
  fromLabel: string;
  from: Party;
  toLabel: string;
  to: Party;
  meta: { label: string; value: string }[];
  columns: { description: string; quantity: string; rate: string; amount: string };
  rows: InvoiceRow[];
  totals: { label: string; amount: number; strong?: boolean }[];
  notes: string[];
  fileName: string;
}

const cropName = (crop: string) => CROP_DISPLAY_NAMES[crop as CropType] ?? crop;
const shortId = (id: string) => id.slice(0, 8).toUpperCase();
const stamp = (date: Date) => format(date, "yyyyMMdd");
const day = (date: Date) => format(date, "d MMM yyyy");

/** "Rs. 1,350.00". The PDF fonts have no rupee sign, so documents spell it out. */
export function inr(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const company: Party = { name: COMPANY.name, lines: [...COMPANY.address, COMPANY.email] };

/** "9000000001@ybl" -> "••••••0001@ybl". Enough to recognise, not enough to use. */
export function maskUpi(upi: string) {
  const [local, handle] = upi.split("@");
  if (!handle) return "••••";
  const visible = local.slice(-4);
  return `${"•".repeat(Math.max(0, local.length - visible.length))}${visible}@${handle}`;
}

// ── Restaurant invoice ───────────────────────────────────────────────────────

/** Only an order that has been paid for gets an invoice. */
export const isInvoiceable = (status: string) => status !== "PENDING_PAYMENT" && status !== "CANCELLED";

export interface RestaurantInvoiceInput {
  order: { id: string; cropType: string; quantityKg: number; totalPrice: number; status: string; createdAt: Date; deliveryDate: Date };
  restaurant: { businessName: string; contactName: string; address: string; city: string; pincode: string; phone: string; gstin: string | null };
  deliveredAt: Date | null;
}

export function restaurantInvoice({ order, restaurant, deliveredAt }: RestaurantInvoiceInput): InvoiceDoc {
  if (!isInvoiceable(order.status)) throw new Error("This order has not been paid, so there is no invoice yet");

  const number = `SB-INV-${stamp(order.createdAt)}-${shortId(order.id)}`;
  const rate = Math.round(order.totalPrice / order.quantityKg);
  return {
    kind: "restaurant",
    title: "Invoice",
    number,
    issuedOn: order.createdAt,
    status: { label: "PAID", paid: true },
    fromLabel: "From",
    from: company,
    toLabel: "Billed to",
    to: {
      name: restaurant.businessName,
      lines: [
        `Attn: ${restaurant.contactName}`,
        restaurant.address,
        `${restaurant.city} ${restaurant.pincode}`.trim(),
        `Phone: ${restaurant.phone}`,
        ...(restaurant.gstin ? [`GSTIN: ${restaurant.gstin}`] : []),
      ],
    },
    meta: [
      { label: "Invoice no.", value: number },
      { label: "Invoice date", value: day(order.createdAt) },
      { label: "Order ref.", value: shortId(order.id) },
      { label: "Delivery date", value: day(order.deliveryDate) },
      ...(deliveredAt ? [{ label: "Delivered on", value: day(deliveredAt) }] : []),
    ],
    columns: { description: "Item", quantity: "Quantity", rate: "Rate", amount: "Amount" },
    rows: [
      {
        description: cropName(order.cropType),
        detail: "Grown to order and delivered fresh",
        quantity: `${order.quantityKg} kg`,
        rate: `${inr(rate)} / kg`,
        amount: order.totalPrice,
      },
    ],
    totals: [
      { label: "Subtotal", amount: order.totalPrice },
      { label: "Total", amount: order.totalPrice, strong: true },
      { label: "Amount paid", amount: order.totalPrice },
      { label: "Balance due", amount: 0 },
    ],
    notes: ["Payment received in full. Thank you for ordering with SproutBox.", "All amounts are in Indian Rupees."],
    fileName: `${number}.pdf`,
  };
}

// ── Grower payout statement ──────────────────────────────────────────────────

export interface GrowerStatementInput {
  task: { id: string; cropType: string; trayCount: number; sowDate: Date; harvestDate: Date; orderId: string };
  grower: { name: string; address: string; city: string; pincode: string; phone: string; upiId: string | null };
  batches: {
    status: string;
    harvestedAt: Date | null;
    payout: { amount: number; status: string; paidAt: Date | null; createdAt: Date } | null;
  }[];
}

export function growerStatement({ task, grower, batches }: GrowerStatementInput): InvoiceDoc {
  const payouts = batches.flatMap((b) => (b.payout ? [b.payout] : []));
  if (payouts.length === 0) throw new Error("There is no payout for this task yet");

  const earned = payouts.reduce((sum, p) => sum + p.amount, 0);
  const paid = payouts.filter((p) => p.status === "PAID").reduce((sum, p) => sum + p.amount, 0);
  const pending = earned - paid;
  const paidDates = payouts.flatMap((p) => (p.paidAt ? [p.paidAt] : []));
  const lastPaid = paidDates.length > 0 ? new Date(Math.max(...paidDates.map((d) => d.getTime()))) : null;
  const harvested = batches.filter((b) => b.payout).length;
  const rejected = batches.filter((b) => b.status === "REJECTED").length;
  const issuedOn = lastPaid ?? new Date(Math.max(...payouts.map((p) => p.createdAt.getTime())));
  const harvestDates = batches.flatMap((b) => (b.harvestedAt ? [b.harvestedAt] : []));
  const harvestedOn = harvestDates.length > 0 ? new Date(Math.min(...harvestDates.map((d) => d.getTime()))) : null;

  const number = `SB-PAY-${stamp(issuedOn)}-${shortId(task.id)}`;
  const allPaid = pending === 0;
  const rows: InvoiceRow[] = [
    {
      description: `${cropName(task.cropType)}: trays accepted`,
      detail: "Harvested and passed quality control",
      quantity: `${harvested} ${harvested === 1 ? "tray" : "trays"}`,
      rate: inr(PAYOUT_PER_TRAY) + " / tray",
      amount: earned,
    },
  ];
  if (rejected > 0) {
    rows.push({
      description: "Trays not accepted",
      detail: "Rejected at quality control, not paid",
      quantity: `${rejected} ${rejected === 1 ? "tray" : "trays"}`,
      rate: inr(0) + " / tray",
      amount: 0,
    });
  }

  return {
    kind: "grower",
    title: "Payout statement",
    number,
    issuedOn,
    status: { label: allPaid ? "PAID" : "PENDING", paid: allPaid },
    fromLabel: "Paid by",
    from: company,
    toLabel: "Paid to",
    to: {
      name: grower.name,
      lines: [grower.address, `${grower.city} ${grower.pincode}`.trim(), `Phone: ${grower.phone}`, ...(grower.upiId ? [`UPI: ${maskUpi(grower.upiId)}`] : [])],
    },
    meta: [
      { label: "Statement no.", value: number },
      { label: allPaid ? "Paid on" : "Statement date", value: day(issuedOn) },
      { label: "Task ref.", value: shortId(task.id) },
      { label: "Order ref.", value: shortId(task.orderId) },
      { label: "Sown", value: day(task.sowDate) },
      ...(harvestedOn ? [{ label: "Harvested", value: day(harvestedOn) }] : []),
    ],
    columns: { description: "Description", quantity: "Trays", rate: "Rate", amount: "Amount" },
    rows,
    totals: [
      { label: "Total earned", amount: earned, strong: true },
      { label: "Paid", amount: paid },
      { label: "Pending", amount: pending },
    ],
    notes: [
      `You are paid ${inr(PAYOUT_PER_TRAY)} for every tray that is harvested and passes quality control.`,
      allPaid ? "This amount has been paid to you in full." : "The pending amount is paid in the next payout run.",
    ],
    fileName: `${number}.pdf`,
  };
}

// ── Platform settlement statement ────────────────────────────────────────────

export interface SettlementInput {
  order: { id: string; cropType: string; quantityKg: number; totalPrice: number; createdAt: Date };
  restaurantName: string;
  deliveredAt: Date | null;
  growers: { name: string; trays: number; rejected: number; payout: number; paid: boolean }[];
}

/** Where the money for one order went: what the restaurant paid, the growers' share, and ours. */
export function settlementStatement({ order, restaurantName, deliveredAt, growers }: SettlementInput): InvoiceDoc {
  const payouts = growers.reduce((sum, g) => sum + g.payout, 0);
  const share = order.totalPrice - payouts;
  const margin = order.totalPrice > 0 ? Math.round((share / order.totalPrice) * 100) : 0;
  const allPaid = growers.every((g) => g.paid);
  const number = `SB-SET-${stamp(order.createdAt)}-${shortId(order.id)}`;

  return {
    kind: "platform",
    title: "Order settlement",
    number,
    issuedOn: deliveredAt ?? order.createdAt,
    status: { label: allPaid ? "SETTLED" : "OPEN", paid: allPaid },
    fromLabel: "Prepared by",
    from: company,
    toLabel: "Order",
    to: { name: `${restaurantName}`, lines: [`${cropName(order.cropType)}, ${order.quantityKg} kg`, `Order ref. ${shortId(order.id)}`] },
    meta: [
      { label: "Statement no.", value: number },
      { label: "Order date", value: day(order.createdAt) },
      ...(deliveredAt ? [{ label: "Delivered on", value: day(deliveredAt) }] : []),
      { label: "Order ref.", value: shortId(order.id) },
    ],
    columns: { description: "Grower payout", quantity: "Trays paid", rate: "Rate", amount: "Amount" },
    rows: growers.map((g) => ({
      description: g.name,
      detail: g.rejected > 0 ? `${g.trays + g.rejected} allocated, ${g.rejected} rejected at QC` : `${g.trays} allocated`,
      quantity: `${g.trays} ${g.trays === 1 ? "tray" : "trays"}`,
      rate: inr(PAYOUT_PER_TRAY) + " / tray",
      amount: g.payout,
    })),
    totals: [
      { label: "Billed to restaurant", amount: order.totalPrice },
      { label: "Paid to growers", amount: payouts },
      { label: "SproutBox share", amount: share, strong: true },
    ],
    notes: [`SproutBox keeps ${margin}% of this order after paying the growers.`, "For internal records."],
    fileName: `${number}.pdf`,
  };
}
