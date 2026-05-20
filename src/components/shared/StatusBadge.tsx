import { cn } from "@/lib/utils";

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

const statusConfig: Record<StatusType, { label: string; classes: string }> = {
  pending: {
    label: "Pending",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  active: {
    label: "Active",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Completed",
    classes: "bg-sprout-50 text-sprout-700 border-sprout-200",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  growing: {
    label: "Growing",
    classes: "bg-green-50 text-green-700 border-green-200",
  },
  sowing: {
    label: "Sowing",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  ready: {
    label: "Ready",
    classes: "bg-sprout-50 text-sprout-700 border-sprout-200",
  },
  delivered: {
    label: "Delivered",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  failed: {
    label: "Failed",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  review: {
    label: "In Review",
    classes: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
