import {
  CROP_CYCLE_DAYS,
  CROP_DISPLAY_NAMES,
  CROP_INSTRUCTIONS,
  type CropType,
} from "@/lib/constants";

// One place for the grower task maths. The task list and the task detail page
// each had their own copy and disagreed on total days (dates vs. crop table).

type BatchLike = {
  status: string;
  currentDay: number;
  checkIns?: { createdAt: Date | string }[];
};

export type TaskLike = {
  cropType: string;
  status: string;
  sowDate: Date;
  harvestDate: Date;
  batches: BatchLike[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Batches that no longer need check-ins.
const DONE_BATCH_STATUSES = ["HARVESTED", "REJECTED", "QC_FAILED"];

export function cropName(cropType: string) {
  return CROP_DISPLAY_NAMES[cropType as CropType] || cropType;
}

export function getTotalDays(task: Pick<TaskLike, "cropType" | "sowDate" | "harvestDate">) {
  const fromCrop = CROP_CYCLE_DAYS[task.cropType as CropType];
  if (fromCrop) return fromCrop;
  return Math.ceil((task.harvestDate.getTime() - task.sowDate.getTime()) / DAY_MS) || 7;
}

export function isSameLocalDay(a: Date | string, b: Date = new Date()) {
  return new Date(a).toDateString() === b.toDateString();
}

// Generic so callers keep their own batch type (an id, say) on `activeBatch`.
export function getTaskState<T extends TaskLike>(task: T, now: Date = new Date()) {
  const currentDay =
    task.batches.length > 0 ? Math.max(...task.batches.map((b) => b.currentDay)) : 0;
  const totalDays = getTotalDays(task);
  const progress = Math.min(100, Math.round((currentDay / totalDays) * 100));

  const activeBatch = task.batches.find((b) => !DONE_BATCH_STATUSES.includes(b.status)) as T["batches"][number] | undefined;
  const lastCheckIn = activeBatch?.checkIns?.[0];
  const checkedInToday = lastCheckIn ? isSameLocalDay(lastCheckIn.createdAt, now) : false;

  const isOpen = task.status === "ASSIGNED" || task.status === "IN_PROGRESS";
  const isCycleComplete = currentDay >= totalDays;

  return {
    currentDay,
    totalDays,
    progress,
    activeBatch,
    checkedInToday,
    isCycleComplete,
    // The three mutually exclusive actions a grower can take on a task:
    canCheckIn: isOpen && !!activeBatch && !isCycleComplete && !checkedInToday,
    canRequestPickup: isOpen && isCycleComplete,
    todayInstruction: CROP_INSTRUCTIONS[task.cropType]?.[currentDay + 1],
  };
}

// Tasks that still need a check-in today (drives the sidebar badge).
export function countCheckinsDue(tasks: TaskLike[], now: Date = new Date()) {
  return tasks.filter((task) => getTaskState(task, now).canCheckIn).length;
}
