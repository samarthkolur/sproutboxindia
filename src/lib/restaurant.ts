import { addDays, format } from "date-fns";
import {
  CROP_CYCLE_DAYS,
  CROP_PRICE_PER_KG,
  CROP_TYPES,
  type CropType,
} from "@/lib/constants";

// Pure helpers behind the restaurant portal: cart maths, the earliest delivery date,
// the order timeline and growth progress, list filters, spend trend and feedback tags.
// No database and no React, so every rule here is unit-tested.

export const rupees = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

// ── Cart and delivery date ───────────────────────────────────────────────────

/**
 * Days between ordering and the earliest delivery, on top of the crop's grow time:
 * one for the team to allocate trays, one to harvest, pack and deliver. It matches the
 * production planner, which sows 11 days before delivery (a 9-day sunflower plus these 2).
 */
export const LEAD_BUFFER_DAYS = 2;

export interface CartItem {
  cropType: CropType;
  quantityKg: number;
}

export const QUANTITY_STEP_KG = 0.5;

export function lineTotal(item: CartItem) {
  return Math.round(item.quantityKg * CROP_PRICE_PER_KG[item.cropType]);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

/** Days from today to the earliest delivery for these crops: the slowest crop sets it. */
export function minDeliveryDays(cropTypes: CropType[]) {
  const cycles = (cropTypes.length > 0 ? cropTypes : [...CROP_TYPES]).map((crop) => CROP_CYCLE_DAYS[crop]);
  const base = cropTypes.length > 0 ? Math.max(...cycles) : Math.min(...cycles);
  return base + LEAD_BUFFER_DAYS;
}

export function minDeliveryDate(cropTypes: CropType[], from: Date = new Date()) {
  return addDays(from, minDeliveryDays(cropTypes));
}

/** yyyy-mm-dd in the visitor's own calendar. (toISOString is UTC and is a day early in India in the evening.) */
export function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

/** Parses a yyyy-mm-dd input value as local midnight. */
export function fromDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export type Recurrence = "weekly" | "biweekly";

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
};

export function parseRecurrence(value: string | null | undefined): Recurrence | null {
  return value === "weekly" || value === "biweekly" ? value : null;
}

export function parseCrop(value: string | null | undefined): CropType | null {
  return (CROP_TYPES as readonly string[]).includes(value ?? "") ? (value as CropType) : null;
}

// ── Order status, timeline and progress ──────────────────────────────────────

export const ORDER_STEPS = [
  { status: "CONFIRMED", title: "Confirmed" },
  { status: "IN_PRODUCTION", title: "In production" },
  { status: "AT_HUB", title: "At hub" },
  { status: "IN_TRANSIT", title: "In transit" },
  { status: "DELIVERED", title: "Delivered" },
] as const;

const STEP_INDEX: Record<string, number> = {
  CONFIRMED: 0,
  IN_PRODUCTION: 1,
  AT_HUB: 2,
  IN_TRANSIT: 3,
  DELIVERED: 4,
};

// The delivery record can be ahead of the order row, never behind it.
const DELIVERY_INDEX: Record<string, number> = { PREPARING: 2, PACKED: 2, IN_TRANSIT: 3, DELIVERED: 4 };

export interface OrderLike {
  status: string;
  createdAt: Date;
}

export interface TimelineInput extends OrderLike {
  delivery?: { status: string; packedAt: Date | null; dispatchedAt: Date | null; deliveredAt: Date | null } | null;
  productionPlan?: { sowDate: Date } | null;
}

/** Which of the five steps the order has reached (0 to 4); -1 while it awaits payment. */
export function stageIndex(order: Pick<TimelineInput, "status" | "delivery">) {
  if (order.status === "PENDING_PAYMENT") return -1;
  const fromOrder = STEP_INDEX[order.status] ?? 0;
  const fromDelivery = order.delivery ? DELIVERY_INDEX[order.delivery.status] ?? 0 : 0;
  return Math.max(fromOrder, fromDelivery);
}

export interface TimelineStep {
  key: string;
  title: string;
  state: "done" | "current" | "upcoming";
  at: Date | null;
}

/**
 * The five-step tracker. (The old one looked the delivery status up in a three-step list
 * and showed an empty bar for every order that had no delivery record yet.)
 */
export function orderTimeline(order: TimelineInput): TimelineStep[] {
  const reached = stageIndex(order);
  const stamps: (Date | null)[] = [
    reached >= 0 ? order.createdAt : null,
    order.productionPlan?.sowDate ?? null,
    order.delivery?.packedAt ?? null,
    order.delivery?.dispatchedAt ?? null,
    order.delivery?.deliveredAt ?? null,
  ];
  return ORDER_STEPS.map((step, index) => {
    // Delivered is the end: reaching it completes the step instead of leaving it "current".
    const state = index < reached || (index === reached && index === ORDER_STEPS.length - 1) ? "done" : index === reached || (reached === -1 && index === 0) ? "current" : "upcoming";
    return { key: step.status, title: step.title, state, at: index <= reached ? stamps[index] : null };
  });
}

export interface GrowthProgress {
  percent: number;
  day: number;
  totalDays: number;
}

/**
 * How far the crop has grown. Before production there is nothing growing yet, and once
 * it leaves the growers (at the hub or later) it is fully grown.
 */
export function growthProgress(
  order: { status: string; cropType: string; productionPlan?: { tasks: { batches: { currentDay: number }[] }[] } | null },
  reached = stageIndex({ status: order.status, delivery: null })
): GrowthProgress {
  const totalDays = CROP_CYCLE_DAYS[order.cropType as CropType] ?? 9;
  if (reached >= 2) return { percent: 100, day: totalDays, totalDays };
  if (reached < 1) return { percent: 0, day: 0, totalDays };
  const days = (order.productionPlan?.tasks ?? []).flatMap((task) => task.batches.map((batch) => batch.currentDay));
  const day = Math.min(totalDays, days.length > 0 ? Math.max(...days) : 0);
  return { percent: Math.round((day / totalDays) * 100), day, totalDays };
}

// ── Lists ────────────────────────────────────────────────────────────────────

export type OrderFilter = "all" | "awaiting" | "production" | "transit" | "delivered" | "cancelled";

export const ORDER_FILTERS: OrderFilter[] = ["all", "awaiting", "production", "transit", "delivered", "cancelled"];

export function orderFilterOf(status: string): Exclude<OrderFilter, "all"> {
  switch (status) {
    case "PENDING_PAYMENT":
      return "awaiting";
    case "CONFIRMED":
    case "IN_PRODUCTION":
      return "production";
    case "AT_HUB":
    case "IN_TRANSIT":
      return "transit";
    case "DELIVERED":
      return "delivered";
    default:
      return "cancelled";
  }
}

export function parseOrderFilter(value: string | undefined): OrderFilter {
  return (ORDER_FILTERS as string[]).includes(value ?? "") ? (value as OrderFilter) : "all";
}

export type OrderSort = "newest" | "oldest" | "amount";

export function parseOrderSort(value: string | undefined): OrderSort {
  return value === "oldest" || value === "amount" ? value : "newest";
}

export const shortId = (id: string) => id.slice(0, 8).toUpperCase();

interface ListedOrder {
  id: string;
  cropType: string;
  status: string;
  quantityKg: number;
  totalPrice: number;
  createdAt: Date;
}

export function searchOrders<T extends ListedOrder>(orders: T[], query: string, cropName: (crop: string) => string) {
  const q = query.trim().toLowerCase();
  if (!q) return orders;
  return orders.filter((order) => shortId(order.id).toLowerCase().includes(q) || cropName(order.cropType).toLowerCase().includes(q));
}

export function sortOrders<T extends ListedOrder>(orders: T[], sort: OrderSort) {
  const copy = [...orders];
  if (sort === "oldest") return copy.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  if (sort === "amount") return copy.sort((a, b) => b.totalPrice - a.totalPrice);
  return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ── Dashboard figures ────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ["CONFIRMED", "IN_PRODUCTION", "AT_HUB", "IN_TRANSIT"];

export const isActiveOrder = (status: string) => ACTIVE_STATUSES.includes(status);

/**
 * Spend this month against last month, from every order (the dashboard summed only the
 * latest five). Cancelled orders are not spend. `change` is null when last month had none,
 * so the tile says nothing instead of inventing a percentage.
 */
export function monthlySpend(orders: { createdAt: Date; totalPrice: number; status: string }[], now: Date = new Date()) {
  const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const counted = orders.filter((order) => order.status !== "CANCELLED");
  const sum = (from: Date, to: Date | null) =>
    counted.filter((o) => o.createdAt >= from && (!to || o.createdAt < to)).reduce((total, o) => total + o.totalPrice, 0);
  const thisMonth = sum(thisStart, null);
  const lastMonth = sum(lastStart, thisStart);
  const change = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
  return { thisMonth, lastMonth, change };
}

export function averageRating(ratings: number[]) {
  if (ratings.length === 0) return null;
  return Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10;
}

/** The soonest delivery date still ahead among orders that are on their way. */
export function nextDelivery<T extends { status: string; deliveryDate: Date }>(orders: T[], now: Date = new Date()) {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return (
    orders
      .filter((order) => isActiveOrder(order.status) && order.deliveryDate >= startOfToday)
      .sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime())[0] ?? null
  );
}

// ── Feedback ─────────────────────────────────────────────────────────────────

export const FEEDBACK_TAGS = ["Quality", "Freshness", "On time", "Packaging"] as const;
export type FeedbackTag = (typeof FEEDBACK_TAGS)[number];

const TAG_PREFIX = "Tags: ";

/** There is no tags column: the chosen tags go on the first line of the notes. */
export function composeFeedbackNotes(tags: string[], notes: string) {
  const known = FEEDBACK_TAGS.filter((tag) => tags.includes(tag));
  const text = notes.trim();
  const head = known.length > 0 ? `${TAG_PREFIX}${known.join(", ")}` : "";
  return [head, text].filter(Boolean).join("\n");
}

export function parseFeedbackNotes(stored: string | null | undefined): { tags: FeedbackTag[]; text: string } {
  if (!stored) return { tags: [], text: "" };
  const [first, ...rest] = stored.split("\n");
  if (!first.startsWith(TAG_PREFIX)) return { tags: [], text: stored };
  const tags = first
    .slice(TAG_PREFIX.length)
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag): tag is FeedbackTag => (FEEDBACK_TAGS as readonly string[]).includes(tag));
  return { tags, text: rest.join("\n").trim() };
}
