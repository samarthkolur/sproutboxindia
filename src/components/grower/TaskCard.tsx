import { CalendarDays } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateShort } from "@/lib/utils";

const taskStatusMap = {
  ASSIGNED: "sowing",
  IN_PROGRESS: "growing",
  HARVEST_READY: "ready",
  HARVESTED: "completed",
  CANCELLED: "cancelled",
} as const;

export function TaskCard({
  cropType,
  trayCount,
  status,
  sowDate,
  harvestDate,
}: {
  cropType: string;
  trayCount: number;
  status: string;
  sowDate: Date;
  harvestDate: Date;
}) {
  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold capitalize text-text-primary">{cropType.replace("-", " ")}</h3>
          <p className="mt-1 text-sm text-text-muted">{trayCount} trays assigned</p>
        </div>
        <StatusBadge status={taskStatusMap[status as keyof typeof taskStatusMap] || "active"} />
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-text-muted">
        <CalendarDays className="h-4 w-4" />
        {formatDateShort(sowDate)} to {formatDateShort(harvestDate)}
      </div>
    </GlassCard>
  );
}
