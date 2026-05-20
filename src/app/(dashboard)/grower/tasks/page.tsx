import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { auth } from "@/lib/auth";
import { CROP_DISPLAY_NAMES, CROP_INSTRUCTIONS, type CropType } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  ClipboardList,
  Calendar,
} from "lucide-react";

async function getGrowerTasks(userId: string) {
  try {
    const grower = await prisma.grower.findUnique({
      where: { userId },
      include: {
        tasks: {
          include: { batches: true },
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          My Tasks
        </h1>
        <p className="text-text-secondary mt-1">
          All assigned growing tasks and their progress
        </p>
      </div>

      {tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task) => {
            const currentDay = task.batches.length > 0
              ? Math.max(...task.batches.map((b) => b.currentDay))
              : 0;
            const totalDays = Math.ceil(
              (task.harvestDate.getTime() - task.sowDate.getTime()) / (1000 * 60 * 60 * 24)
            ) || 7;
            const progress = Math.round((currentDay / totalDays) * 100);
            const cropName = CROP_DISPLAY_NAMES[task.cropType as CropType] || task.cropType;
            const instructions = CROP_INSTRUCTIONS[task.cropType];
            const todayInstruction = instructions?.[currentDay + 1];

            return (
              <GlassCard key={task.id}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-text-primary">{cropName}</h2>
                      <StatusBadge
                        status={
                          task.status === "IN_PROGRESS" ? "growing" :
                          task.status === "ASSIGNED" ? "sowing" :
                          task.status === "HARVEST_READY" ? "ready" :
                          task.status === "HARVESTED" ? "completed" : "active"
                        }
                      />
                    </div>
                    <p className="text-sm text-text-muted">
                      {task.trayCount} trays · Day {currentDay} of {totalDays}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Sow: {task.sowDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      {" "}→ Harvest: {task.harvestDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-text-muted">Progress</span>
                    <span className="font-semibold text-sprout-700">{progress}%</span>
                  </div>
                  <div className="w-full bg-sprout-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-sprout-600 to-sprout-400 h-2 rounded-full progress-bar-animate"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {todayInstruction && (
                  <div className="bg-sprout-50/50 rounded-xl p-4 border border-sprout-200/30">
                    <p className="text-xs font-semibold text-sprout-700 mb-1">
                      Day {currentDay + 1} Instructions
                    </p>
                    <p className="text-sm text-text-secondary">{todayInstruction}</p>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard>
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">No tasks assigned</h3>
            <p className="text-sm text-text-muted">
              New growing tasks will appear here when the admin assigns them to you
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
