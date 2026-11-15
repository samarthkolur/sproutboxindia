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

// ── Allocation: who grows an order ──────────────────────────────────────────

export interface GrowerInput {
  id: string;
  name: string;
  city: string;
  kitSize: number;
  /** Trays they are already growing (not tasks: a task can hold many trays). */
  activeTrays: number;
  compositeScore: number;
  lat: number | null;
  lng: number | null;
  fssaiVerified: boolean;
}

export interface Candidate extends GrowerInput {
  free: number;
  distanceKm: number | null;
  combined: number;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MAX_DISTANCE_KM = 30;

/**
 * Growers scored for one order: half how close they are to the restaurant (linear, nothing beyond
 * 30 km, a middling 0.3 when a location is missing) and half their overall score, with the room
 * they have left (kit size minus trays already growing). Best first.
 */
export function scoreCandidates(growers: GrowerInput[], restaurant: { lat: number | null; lng: number | null }): Candidate[] {
  return growers
    .map((g) => {
      const distanceKm = g.lat != null && g.lng != null && restaurant.lat != null && restaurant.lng != null ? haversineKm(g.lat, g.lng, restaurant.lat, restaurant.lng) : null;
      const proximity = distanceKm === null ? 0.3 : Math.max(0, 1 - distanceKm / MAX_DISTANCE_KM);
      return { ...g, free: Math.max(0, g.kitSize - g.activeTrays), distanceKm, combined: proximity * 0.5 + g.compositeScore * 0.5 };
    })
    .sort((a, b) => b.combined - a.combined);
}

/**
 * A starting split of `total` trays, in proportion to each grower's score but never more than
 * they have room for. If everyone's room runs out, the rest is left unassigned and shown as such.
 */
export function proposeAllocation(candidates: Candidate[], total: number): Record<string, number> {
  const give: Record<string, number> = {};
  for (const c of candidates) give[c.id] = 0;
  let left = total;

  while (left > 0) {
    const pool = candidates.filter((c) => give[c.id] < c.free);
    if (pool.length === 0) break;
    const weight = pool.reduce((sum, c) => sum + Math.max(c.combined, 0.01), 0);
    let given = 0;
    for (const c of pool) {
      const share = Math.floor((left * Math.max(c.combined, 0.01)) / weight);
      const take = Math.min(share, c.free - give[c.id]);
      give[c.id] += take;
      given += take;
    }
    left -= given;
    if (given === 0) {
      // Fewer trays left than growers: hand them out one at a time, best first.
      for (const c of pool) {
        if (left === 0) break;
        give[c.id] += 1;
        left -= 1;
      }
    }
  }
  return give;
}

export interface AllocationCheck {
  assigned: number;
  remaining: number;
  /** Ids of growers given more trays than they have room for. */
  overCapacity: string[];
  /** Exactly the plan's trays, nobody over capacity: the only state that may be sent. */
  ok: boolean;
}

export function checkAllocation(assignments: Record<string, number>, candidates: Candidate[], total: number): AllocationCheck {
  const assigned = Object.values(assignments).reduce((sum, n) => sum + n, 0);
  const overCapacity = candidates.filter((c) => (assignments[c.id] ?? 0) > c.free).map((c) => c.id);
  return { assigned, remaining: total - assigned, overCapacity, ok: assigned === total && overCapacity.length === 0 };
}

// ── QC review ───────────────────────────────────────────────────────────────

export const QC_REASONS = ["Mould or fungus", "Uneven germination", "Pale or yellow stems", "Too short", "Sparse coverage", "Pests or damage"] as const;

/**
 * The note that goes to the grower with a verdict: the chosen reasons, then anything typed.
 * (The action has always accepted notes; the old screen never sent any.)
 */
export function composeQcNotes(reasons: string[], text: string) {
  const known = QC_REASONS.filter((reason) => reasons.includes(reason));
  const head = known.join(", ");
  const extra = text.trim();
  if (head && extra) return `${head}. ${extra}`;
  return head || extra;
}

export type QcDecision = "PASS" | "RISK" | "REJECT";

/** A reject must say why: the grower reads this note to fix the next tray. */
export function decisionError(result: QcDecision, notes: string) {
  return result === "REJECT" && notes.trim() === "" ? "Choose a reason or write a note so the grower knows what to fix." : null;
}

/** The decision a keyboard key stands for (P pass, R risk, X reject), or null. */
export function decisionForKey(key: string): QcDecision | null {
  const k = key.toLowerCase();
  return k === "p" ? "PASS" : k === "r" ? "RISK" : k === "x" ? "REJECT" : null;
}

/** The index to show after the current one is gone from a queue of `length`. */
export function nextIndex(current: number, length: number, direction: 1 | -1 = 1) {
  if (length <= 0) return -1;
  return (current + direction + length) % length;
}
