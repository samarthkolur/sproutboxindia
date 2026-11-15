import { StatusChip, type Tone } from "@/components/ui/status-chip";

type StatusType =
  | "pending"
  | "active"
  | "completed"
  | "cancelled"
  | "growing"
  | "sowing"
  | "ready"
  | "delivered"
  | "failed"
  | "review";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

// Legacy wrapper: old lowercase statuses now render through the single StatusChip map.
const LEGACY: Record<StatusType, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "watch" },
  active: { label: "Active", tone: "info" },
  completed: { label: "Completed", tone: "good" },
  cancelled: { label: "Cancelled", tone: "risk" },
  growing: { label: "Growing", tone: "info" },
  sowing: { label: "Sowing", tone: "neutral" },
  ready: { label: "Ready", tone: "good" },
  delivered: { label: "Delivered", tone: "good" },
  failed: { label: "Failed", tone: "risk" },
  review: { label: "In Review", tone: "watch" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = LEGACY[status];
  return <StatusChip label={config.label} tone={config.tone} className={className} />;
}
