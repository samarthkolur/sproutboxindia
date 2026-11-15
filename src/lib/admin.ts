import { addDays, format } from "date-fns";
import {
  CROP_CYCLE_DAYS,
  CROP_DISPLAY_NAMES,
  DEFAULT_BUFFER_PERCENT,
  TRAY_YIELD_GRAMS,
  type CropType,
} from "@/lib/constants";

// Pure helpers behind the admin portal. Kept free of the database and of React so the rules
// (how many trays an order needs, who has room, what counts as late) are unit-tested, and
// free of lib/business.ts so client components can import them without pulling in Prisma.

export const cropName = (crop: string) => CROP_DISPLAY_NAMES[crop as CropType] ?? crop;
export const shortId = (id: string) => id.slice(0, 8).toUpperCase();
export const rupees = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from `now` to `date` (negative once it has passed). */
export function daysUntil(date: Date, now: Date = new Date()) {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((a - b) / DAY_MS);
}

/** "2 days ago", "today", "3 hours ago": how long something has been waiting. */
export function waitingFor(since: Date, now: Date = new Date()) {
  const hours = Math.floor((now.getTime() - since.getTime()) / (60 * 60 * 1000));
  if (hours < 1) return "just now";
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

// ── Demand: turning an order into a production plan ─────────────────────────

/**
 * The plan for one order, from its quantity and delivery date. This is the single place the
 * tray maths lives: the Demand page previews it and the create-plan action stores it, so the
 * two cannot disagree. Harvest is the day before delivery and sowing starts 10 days before that.
 */
export function planOrder(order: { cropType: string; quantityKg: number; deliveryDate: Date }) {
  const baseTrays = Math.ceil((order.quantityKg * 1000) / TRAY_YIELD_GRAMS);
  const bufferTrays = Math.ceil(baseTrays * DEFAULT_BUFFER_PERCENT);
  const harvestDate = addDays(order.deliveryDate, -1);
  return {
    baseTrays,
    bufferTrays,
    totalTrays: baseTrays + bufferTrays,
    bufferPercent: DEFAULT_BUFFER_PERCENT,
    cycleDays: CROP_CYCLE_DAYS[order.cropType as CropType] ?? 9,
    sowDate: addDays(harvestDate, -10),
    harvestDate,
  };
}

export type Urgency = "overdue" | "urgent" | "soon" | "ok";

/** How pressing an order is, from the days left to its delivery date. */
export function urgencyOf(deliveryDate: Date, now: Date = new Date()): { level: Urgency; days: number } {
  const days = daysUntil(deliveryDate, now);
  // Sowing starts 11 days before delivery, so anything inside that window is already behind.
  if (days < 11) return { level: days < 0 ? "overdue" : "urgent", days };
  return { level: days <= 14 ? "soon" : "ok", days };
}

export function sortByUrgency<T extends { deliveryDate: Date }>(items: T[]) {
  return [...items].sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime());
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export interface WeekTotal {
  label: string;
  value: number;
}

/** Sums of `value` per real 7-day window, oldest first; the last window ends now. */
export function weeklyTotals(rows: { at: Date | null; value: number }[], now: Date = new Date(), weeks = 12): WeekTotal[] {
  const out: WeekTotal[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = addDays(now, -7 * i);
    const start = addDays(end, -7);
    const value = rows.filter((row) => row.at && row.at > start && row.at <= end).reduce((sum, row) => sum + row.value, 0);
    out.push({ label: format(start, "d MMM"), value });
  }
  return out;
}

export interface PipelineCounts {
  demand: number;
  allocate: number;
  dispatch: number;
  qc: number;
  payout: number;
}

/** What is waiting at each step, as short clauses. Empty when the pipeline is clear. */
export function pipelineClauses(counts: PipelineCounts) {
  const clauses: string[] = [];
  if (counts.demand > 0) clauses.push(counts.demand === 1 ? "1 order needs a plan" : `${counts.demand} orders need a plan`);
  if (counts.allocate > 0) clauses.push(counts.allocate === 1 ? "1 plan needs growers" : `${counts.allocate} plans need growers`);
  if (counts.dispatch > 0) clauses.push(counts.dispatch === 1 ? "1 task is waiting for supplies" : `${counts.dispatch} tasks are waiting for supplies`);
  if (counts.qc > 0) clauses.push(counts.qc === 1 ? "1 tray is waiting for QC" : `${counts.qc} trays are waiting for QC`);
  if (counts.payout > 0) clauses.push(counts.payout === 1 ? "1 payout is pending" : `${counts.payout} payouts are pending`);
  return clauses;
}

/** The one line under the greeting: what is waiting, or that nothing is. */
export function pipelineSentence(counts: PipelineCounts) {
  const clauses = pipelineClauses(counts);
  return clauses.length === 0 ? "Everything is up to date. Nothing is waiting for you." : `${clauses.join(", ")}.`;
}

export const PIPELINE_STEPS = [
  { key: "demand", label: "Demand", href: "/admin/demand", caption: "orders need a plan" },
  { key: "allocate", label: "Allocate", href: "/admin/allocate", caption: "plans need growers" },
  { key: "dispatch", label: "Dispatch", href: "/admin/dispatch", caption: "tasks need supplies" },
  { key: "qc", label: "QC", href: "/admin/qc", caption: "trays to review" },
  { key: "payout", label: "Payout", href: "/admin/payouts", caption: "payouts pending" },
] as const;

/** Share of reviewed trays that passed, as a whole percent; null before anything is reviewed. */
export function qcPassPercent(passed: number, reviewed: number) {
  return reviewed > 0 ? Math.round((passed / reviewed) * 100) : null;
}
