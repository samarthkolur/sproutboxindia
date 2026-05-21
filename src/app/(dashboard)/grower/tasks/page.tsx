import Link from "next/link";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { auth } from "@/lib/auth";
import {
  CROP_DISPLAY_NAMES,
  CROP_INSTRUCTIONS,
  type CropType,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  ClipboardList,
  Calendar,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { CheckinModal } from "@/components/grower/CheckinModal";

async function getGrowerTasks(userId: string) {
  try {
    const grower = await prisma.grower.findUnique({
      where: { userId },
      include: {
        tasks: {
          include: {
            batches: {
              include: {
                checkIns: { orderBy: { day: "desc" }, take: 1 },
              },
              orderBy: { trayNumber: "asc" },
            },
          },
          orderBy: { sowDate: "desc" },
        },
      },
    });
    return grower?.tasks || [];
  } catch {
    return [];
  }
}

export default async function GrowerTasksPage() {
  const session = await auth();
  const userId = session?.user?.id || "";
  const tasks = await getGrowerTasks(userId);

  const activeTasks = tasks.filter(
    (t) => t.status === "ASSIGNED" || t.status === "IN_PROGRESS"
  );
  const completedTasks = tasks.filter(
    (t) => t.status === "HARVESTED" || t.status === "CANCELLED"
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          My Tasks
        </h1>
        <p className="text-text-secondary mt-1">
          {activeTasks.length} active task{activeTasks.length !== 1 ? "s" : ""}{" "}
          · {completedTasks.length} completed
        </p>
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-6">
          {/* Active tasks */}
          {activeTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                Active
              </h2>
              <div className="space-y-4">
                {activeTasks.map((task) => {
                  const currentDay =
                    task.batches.length > 0
                      ? Math.max(...task.batches.map((b) => b.currentDay))
                      : 0;
                  const totalDays =
                    Math.ceil(
                      (task.harvestDate.getTime() -
                        task.sowDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) || 7;
                  const progress = Math.round((currentDay / totalDays) * 100);
                  const cropName =
                    CROP_DISPLAY_NAMES[task.cropType as CropType] ||
                    task.cropType;
                  const instructions = CROP_INSTRUCTIONS[task.cropType];
                  const todayInstruction = instructions?.[currentDay + 1];

                  // Find active batch for check-in
                  const activeBatch = task.batches.find(
                    (b) =>
                      b.status !== "HARVESTED" &&
                      b.status !== "REJECTED"
                  );
                  const alreadyCheckedIn =
                    activeBatch?.checkIns[0]?.day === currentDay + 1;

                  return (
                    <GlassCard key={task.id}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-lg font-bold text-text-primary">
                              {cropName}
                            </h2>
                            <StatusBadge
                              status={
                                task.status === "IN_PROGRESS"
                                  ? "growing"
                                  : task.status === "ASSIGNED"
                                  ? "sowing"
                                  : task.status === "HARVEST_READY"
                                  ? "ready"
                                  : "active"
                              }
                            />
                          </div>
                          <p className="text-sm text-text-muted">
                            {task.trayCount} trays · Day {currentDay} of{" "}
                            {totalDays}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="flex items-center gap-1 text-xs text-text-muted">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {task.sowDate.toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              →{" "}
                              {task.harvestDate.toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-text-muted">Progress</span>
                          <span className="font-semibold text-sprout-700">
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full bg-sprout-100 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-sprout-600 to-sprout-400 h-2 rounded-full progress-bar-animate"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Today's instruction */}
                      {todayInstruction && (
                        <div className="bg-sprout-50/50 rounded-xl p-4 border border-sprout-200/30 mb-4">
                          <p className="text-xs font-semibold text-sprout-700 mb-1">
                            Day {currentDay + 1} — Today&apos;s Task
                          </p>
                          <p className="text-sm text-text-secondary">
                            {todayInstruction}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        {activeBatch && !alreadyCheckedIn ? (
                          <CheckinModal
                            batchId={activeBatch.id}
                            day={currentDay + 1}
                          />
                        ) : activeBatch && alreadyCheckedIn ? (
                          <span className="flex items-center gap-1.5 text-sm text-sprout-700 font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Checked in today
                          </span>
                        ) : (
                          <span />
                        )}
                        <Link
                          href={`/grower/tasks/${task.id}`}
                          className="flex items-center gap-1 text-sm text-sprout-700 font-semibold hover:text-sprout-900 transition-colors"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                Completed
              </h2>
              <div className="space-y-3">
                {completedTasks.map((task) => {
                  const cropName =
                    CROP_DISPLAY_NAMES[task.cropType as CropType] ||
                    task.cropType;
                  return (
                    <Link
                      key={task.id}
                      href={`/grower/tasks/${task.id}`}
                      className="flex items-center gap-4 bg-white/40 rounded-xl p-4 border border-white/30 hover:bg-white/60 transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-text-primary">
                            {cropName}
                          </p>
                          <StatusBadge
                            status={
                              task.status === "HARVESTED"
                                ? "completed"
                                : "cancelled"
                            }
                          />
                        </div>
                        <p className="text-xs text-text-muted">
                          {task.trayCount} trays ·{" "}
                          {task.harvestDate.toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 group-hover:text-sprout-800 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <GlassCard>
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              No tasks assigned
            </h3>
            <p className="text-sm text-text-muted">
              New growing tasks will appear here when the admin assigns them to you
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
