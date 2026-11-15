import { CheckCircle2 } from "lucide-react";
import { getTaskState, type TaskLike } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type { ActionTone } from "./action-button";
import { CheckinModal } from "./CheckinModal";
import { RequestPickupButton } from "./RequestPickupButton";

type ActionTask = TaskLike & { id: string; batches: (TaskLike["batches"][number] & { id: string })[] };

// The one thing a grower can do with a task right now (V6: one primary action):
// check in, request pickup, or a quiet "done" note. Never two at once.
export function TaskAction({ task, tone = "solid", className }: { task: ActionTask; tone?: ActionTone; className?: string }) {
  const state = getTaskState(task);

  if (state.canRequestPickup) return <RequestPickupButton taskId={task.id} tone={tone} />;

  if (state.canCheckIn && state.activeBatch) {
    return <CheckinModal batchId={state.activeBatch.id} day={Math.min(state.currentDay + 1, state.totalDays)} tone={tone} />;
  }

  const note =
    task.status === "HARVEST_READY"
      ? "Pickup requested"
      : state.checkedInToday && (task.status === "ASSIGNED" || task.status === "IN_PROGRESS")
        ? "Checked in today"
        : null;
  if (!note) return null;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", tone === "onDark" ? "text-brand-ink" : "text-good", className)}>
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      {note}
    </span>
  );
}
