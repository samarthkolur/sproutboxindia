import { notFound } from "next/navigation";
import { DayInstructions } from "@/components/grower/DayInstructions";
import { TaskCard } from "@/components/grower/TaskCard";
import { CheckinModal } from "@/components/grower/CheckinModal";
import { RequestPickupButton } from "@/components/grower/RequestPickupButton";
import { GlassCard } from "@/components/shared/GlassCard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CROP_DISPLAY_NAMES, CROP_CYCLE_DAYS, type CropType } from "@/lib/constants";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default async function GrowerTaskDetailPage({
  params,
}: {
  params: { taskId: string };
}) {
  const session = await auth();
  const task = await prisma.task.findFirst({
    where: { id: params.taskId, grower: { userId: session?.user?.id } },
    include: {
      batches: {
        include: { checkIns: { orderBy: { day: "desc" }, take: 1 } },
        orderBy: { trayNumber: "asc" },
      },
    },
  });

  if (!task) notFound();

  const currentDay =
    task.batches.length > 0
      ? Math.max(...task.batches.map((b) => b.currentDay))
      : 0;

  // Find the "active" batch — first non-harvested, non-rejected batch
  const activeBatch = task.batches.find(
    (b) =>
      b.status !== "HARVESTED" &&
      b.status !== "REJECTED" &&
      b.status !== "QC_FAILED"
  );

  const lastCheckIn = activeBatch?.checkIns?.[0];
  const alreadyCheckedInToday = lastCheckIn
    ? new Date(lastCheckIn.createdAt).toDateString() === new Date().toDateString()
    : false;

  const totalDays = CROP_CYCLE_DAYS[task.cropType as CropType] || 7;
  const isCompleted = currentDay >= totalDays;

  const cropName =
    CROP_DISPLAY_NAMES[task.cropType as CropType] || task.cropType;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <a href="/grower/tasks" className="hover:text-sprout-700 transition-colors">
          My Tasks
        </a>
        <span>/</span>
        <span className="text-text-primary font-medium">{cropName}</span>
      </div>

      <TaskCard
        cropType={task.cropType}
        trayCount={task.trayCount}
        status={task.status}
        sowDate={task.sowDate}
        harvestDate={task.harvestDate}
      />

      {/* Check-in or Pickup CTA */}
      {isCompleted && task.status !== "HARVEST_READY" && task.status !== "HARVESTED" && task.status !== "CANCELLED" ? (
        <GlassCard>
          <div className="flex flex-col gap-4 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary mb-1">
                Microgreens are Ready!
              </h3>
              <div className="flex items-center gap-2 text-sm text-sprout-700">
                <CheckCircle2 className="w-4 h-4" />
                <span>Growth cycle complete. Request pickup for delivery.</span>
              </div>
            </div>
            <RequestPickupButton taskId={task.id} />
          </div>
        </GlassCard>
      ) : activeBatch && task.status !== "HARVESTED" && task.status !== "CANCELLED" && (
        <GlassCard>
          <div className="flex flex-col gap-4 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between">
            <div>
              <h3 className="text-base font-bold text-text-primary mb-1">
                Day {Math.min(currentDay + 1, totalDays)} Action Required
              </h3>
              {alreadyCheckedInToday ? (
                <div className="flex items-center gap-2 text-sm text-sprout-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Check-in submitted for today. Great work!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>Submit today&apos;s check-in with photos to stay on track.</span>
                </div>
              )}
            </div>
            {!alreadyCheckedInToday && (
              <CheckinModal batchId={activeBatch.id} day={Math.min(currentDay + 1, totalDays)} />
            )}
          </div>
        </GlassCard>
      )}

      {/* Day-by-day instructions */}
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-4">
          Day-by-Day Instructions
        </h2>
        <DayInstructions
          cropType={task.cropType}
          currentDay={currentDay}
          batchId={activeBatch?.id}
          hasCheckedInToday={alreadyCheckedInToday}
        />
      </div>
    </div>
  );
}
