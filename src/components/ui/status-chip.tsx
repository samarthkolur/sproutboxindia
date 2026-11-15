import { cn } from "@/lib/utils";

// The single status map. Orders, tasks, batches, deliveries, payouts, QC and
// FSSAI all resolve here, so a status looks the same on every page.
// Status is always shown as dot + word, never colour alone.

export type Tone = "good" | "watch" | "risk" | "neutral" | "strong" | "info";

const TONE_CLASSES: Record<Tone, string> = {
  good: "bg-good-soft text-good",
  watch: "bg-watch-soft text-watch",
  risk: "bg-risk-soft text-risk",
  neutral: "bg-inset text-ink-soft",
  strong: "bg-brand text-brand-ink", // "New" style: the one solid chip
  info: "bg-leaf-soft text-ink",
};

export const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  // Order
  PENDING_PAYMENT: { label: "Awaiting payment", tone: "watch" },
  CONFIRMED: { label: "Confirmed", tone: "neutral" },
  IN_PRODUCTION: { label: "In production", tone: "info" },
  AT_HUB: { label: "At hub", tone: "info" },
  IN_TRANSIT: { label: "In transit", tone: "info" },
  DELIVERED: { label: "Delivered", tone: "good" },
  CANCELLED: { label: "Cancelled", tone: "risk" },
  // Task
  ASSIGNED: { label: "Assigned", tone: "neutral" },
  IN_PROGRESS: { label: "Growing", tone: "info" },
  HARVEST_READY: { label: "Ready for pickup", tone: "good" },
  HARVESTED: { label: "Harvested", tone: "good" },
  // Batch
  SOWING: { label: "Sowing", tone: "neutral" },
  GROWING: { label: "Growing", tone: "info" },
  PRE_HARVEST: { label: "Pre-harvest", tone: "info" },
  QC_PENDING: { label: "QC pending", tone: "watch" },
  QC_PASSED: { label: "QC passed", tone: "good" },
  QC_FAILED: { label: "QC failed", tone: "risk" },
  REJECTED: { label: "Rejected", tone: "risk" },
  // Delivery
  PREPARING: { label: "Preparing", tone: "neutral" },
  PACKED: { label: "Packed", tone: "info" },
  FAILED: { label: "Failed", tone: "risk" },
  // Payout
  PENDING: { label: "Pending", tone: "watch" },
  PROCESSING: { label: "Processing", tone: "info" },
  PAID: { label: "Paid", tone: "good" },
  // QC verdicts
  PASS: { label: "Pass", tone: "good" },
  RISK: { label: "Risk", tone: "watch" },
  REJECT: { label: "Reject", tone: "risk" },
  // FSSAI compliance (derived, not a DB enum)
  FSSAI_VERIFIED: { label: "FSSAI verified", tone: "good" },
  FSSAI_PENDING: { label: "FSSAI pending", tone: "watch" },
  FSSAI_MISSING: { label: "No FSSAI", tone: "risk" },
  // Account / activity
  ACTIVE: { label: "Active", tone: "good" },
  INACTIVE: { label: "Inactive", tone: "neutral" },
  DORMANT: { label: "Dormant", tone: "watch" },
  NEW: { label: "New", tone: "strong" },
};

export function StatusChip({
  status,
  label,
  tone,
  className,
}: {
  /** An enum value (e.g. QC_PENDING) or a key from STATUS_MAP. */
  status?: string;
  label?: string;
  tone?: Tone;
  className?: string;
}) {
  const known = status ? STATUS_MAP[status] : undefined;
  const resolvedTone = tone ?? known?.tone ?? "neutral";
  const text = label ?? known?.label ?? status ?? "";

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-micro font-medium",
        TONE_CLASSES[resolvedTone],
        className
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      <span className="truncate">{text}</span>
    </span>
  );
}
