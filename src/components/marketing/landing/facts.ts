import {
  CROP_CYCLE_DAYS,
  CROP_TYPES,
  DEFAULT_BUFFER_PERCENT,
  KIT_OPTIONS,
  PAYOUT_PER_TRAY,
} from "@/lib/constants";

// Every number on the landing page is derived here from the same constants the
// app runs on, so the marketing copy cannot drift from the product.
const cycleDays = Object.values(CROP_CYCLE_DAYS);

export const LANDING_FACTS = {
  varieties: CROP_TYPES.length,
  minDays: Math.min(...cycleDays),
  maxDays: Math.max(...cycleDays),
  bufferPercent: Math.round(DEFAULT_BUFFER_PERCENT * 100),
  payoutPerTray: PAYOUT_PER_TRAY,
  startTrays: KIT_OPTIONS[0].trays,
  // Digital check at the field, hub inspection, delivery check.
  qcStages: 3,
} as const;
