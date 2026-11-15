import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { CROP_IMAGES, type CropType } from "@/lib/constants";
import { cropName, getTaskState, type TaskLike } from "@/lib/tasks";
import { Panel } from "@/components/ui/panel";
import { Ring } from "@/components/ui/ring";
import { StatusChip } from "@/components/ui/status-chip";
import { TaskAction } from "./TaskAction";

type CardTask = TaskLike & {
  id: string;
  trayCount: number;
  batches: (TaskLike["batches"][number] & { id: string })[];
};

// One task on the list: photo, status, ring, today's instruction and a single action.
// The crop name is the link to the detail page, stretched over the card; the action
// sits above it so both stay clickable (no button inside an anchor).
export function GrowerTaskCard({ task }: { task: CardTask }) {
  const state = getTaskState(task);
  const open = task.status === "ASSIGNED" || task.status === "IN_PROGRESS";
  const image = CROP_IMAGES[task.cropType as CropType];

  return (
    <Panel padding="none" className="relative overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-brand/40 hover:shadow-pop">
      <div className="flex flex-col sm:flex-row">
        {image ? (
          <div className="relative h-36 w-full shrink-0 bg-inset sm:h-auto sm:w-40">
            <Image src={image} alt="" fill sizes="(min-width: 640px) 160px, 100vw" className="object-cover" />
          </div>
        ) : null}

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-medium text-ink">
                  <Link href={`/grower/tasks/${task.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                    {cropName(task.cropType)}
                  </Link>
                </h2>
                <StatusChip status={task.status} />
              </div>
              <p className="mt-1 text-sm text-ink-soft">{`${task.trayCount} trays · Day ${state.currentDay} of ${state.totalDays}`}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-micro text-ink-muted">
                <time dateTime={task.sowDate.toISOString()}>{format(task.sowDate, "d MMM")}</time>
                <span aria-hidden="true">→</span>
                <time dateTime={task.harvestDate.toISOString()}>{format(task.harvestDate, "d MMM")}</time>
              </p>
            </div>
            <Ring percent={state.progress} size={60} strokeWidth={6} label={`${state.progress}% grown`}>
              <span className="text-sm font-medium tabular-nums text-ink">{`${state.progress}%`}</span>
            </Ring>
          </div>

          {open && state.todayInstruction ? (
            <div className="mt-3 rounded-tile bg-inset/60 p-3">
              <p className="text-micro font-medium text-ink-muted">{`Day ${Math.min(state.currentDay + 1, state.totalDays)}`}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{state.todayInstruction}</p>
            </div>
          ) : null}

          <div className="relative z-10 mt-4 flex min-h-[2.25rem] items-center">
            <TaskAction task={task} />
          </div>
        </div>
      </div>
    </Panel>
  );
}
