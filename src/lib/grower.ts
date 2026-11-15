import { addDays, format } from "date-fns";
import { CROP_CYCLE_DAYS, CROP_INSTRUCTIONS, type CropType } from "@/lib/constants";

// Pure helpers behind the grower portal. Everything the pages show as a number or
// a state is decided here, so it can be tested without a database or a browser.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Time-aware greeting in Indian Standard Time, whatever the server's timezone is. */
export function greetingFor(now: Date = new Date()) {
  const hour = new Date(now.getTime() + IST_OFFSET_MS).getUTCHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ── Earnings ────────────────────────────────────────────────────────────────

export interface EarningsBucket {
  label: string;
  value: number;
}

/**
 * Paid amounts per real 7-day window, oldest first. The last window ends now, so
 * "this week" is the most recent seven days. (The old dashboard charted the last
 * seven individual payouts and called them weekly.)
 */
export function weeklyEarnings(
  payouts: { amount: number; paidAt: Date | null }[],
  now: Date = new Date(),
  weeks = 12
): EarningsBucket[] {
  const buckets: EarningsBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = addDays(now, -7 * i);
    const start = addDays(end, -7);
    const value = payouts
      .filter((p) => p.paidAt && p.paidAt > start && p.paidAt <= end)
      .reduce((sum, p) => sum + p.amount, 0);
    buckets.push({ label: format(start, "d MMM"), value });
  }
  return buckets;
}

export function earningsSummary(payouts: { amount: number; status: string }[]) {
  let paid = 0;
  let pending = 0;
  for (const payout of payouts) {
    if (payout.status === "PAID") paid += payout.amount;
    else if (payout.status === "PENDING" || payout.status === "PROCESSING") pending += payout.amount;
  }
  return { paid, pending };
}

export const rupees = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`;

// ── Quality ─────────────────────────────────────────────────────────────────

/**
 * What the QC tile says. A new grower's stored score is the 0.5 default, which
 * would read as "50%, needs improvement" before anyone has reviewed anything.
 */
export function qcTile(qualityScore: number, reviewedCheckIns: number) {
  if (reviewedCheckIns === 0) {
    return { value: "—", caption: "No reviews yet. Scores appear after your first QC check.", tone: "neutral" as const };
  }
  const percent = Math.round(qualityScore * 100);
  if (percent >= 90) return { value: `${percent}%`, caption: "Excellent. Restaurants rely on you.", tone: "good" as const };
  if (percent >= 70) return { value: `${percent}%`, caption: "Good. Sharp photos and on-time check-ins raise it.", tone: "neutral" as const };
  return { value: `${percent}%`, caption: "Below target. Check the QC notes on your trays.", tone: "watch" as const };
}

// ── Compliance and masking ──────────────────────────────────────────────────

export type FssaiState = "FSSAI_VERIFIED" | "FSSAI_PENDING" | "FSSAI_MISSING";

export function fssaiState(grower: { fssaiRegNumber?: string | null; fssaiVerifiedAt?: Date | null }): FssaiState {
  if (grower.fssaiVerifiedAt) return "FSSAI_VERIFIED";
  return grower.fssaiRegNumber ? "FSSAI_PENDING" : "FSSAI_MISSING";
}

/** "123456789012" → "••••••••9012". Short values are masked fully. */
export function maskValue(value: string | null | undefined, visible = 4) {
  if (!value) return "";
  if (value.length <= visible) return "•".repeat(value.length);
  return "•".repeat(value.length - visible) + value.slice(-visible);
}

// ── Tasks ───────────────────────────────────────────────────────────────────

export type TaskFilter = "active" | "pickup" | "completed";

/** Which list a task belongs in. Ready-for-pickup tasks used to vanish from the list. */
export function taskFilterOf(status: string): TaskFilter {
  if (status === "HARVEST_READY") return "pickup";
  if (status === "HARVESTED" || status === "CANCELLED") return "completed";
  return "active";
}

export interface DayStep {
  day: number;
  instruction: string;
  state: "done" | "current" | "upcoming";
}

/** The day-by-day plan for one task: done up to today's progress, one current day, then upcoming. */
export function dayPlan(cropType: string, currentDay: number, open: boolean): DayStep[] {
  const total = CROP_CYCLE_DAYS[cropType as CropType] ?? 9;
  const instructions = CROP_INSTRUCTIONS[cropType] ?? {};
  return Array.from({ length: total }, (_, index) => {
    const day = index + 1;
    const state: DayStep["state"] = day <= currentDay ? "done" : open && day === currentDay + 1 ? "current" : "upcoming";
    return { day, instruction: instructions[day] ?? "Water 150ml and monitor growth.", state };
  });
}

export function sentenceForCheckins(due: number, activeTrays: number) {
  if (due > 0) return due === 1 ? "1 task needs a check-in today." : `${due} tasks need a check-in today.`;
  if (activeTrays > 0) return "You are all caught up. Nothing is due today.";
  return "No trays are growing yet. New tasks appear here when they are assigned to you.";
}
