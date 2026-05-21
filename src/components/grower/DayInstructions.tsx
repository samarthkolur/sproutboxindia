import { CROP_CYCLE_DAYS, CROP_INSTRUCTIONS } from "@/lib/constants";
import { CheckCircle2, Lock } from "lucide-react";
import { CheckinModal } from "@/components/grower/CheckinModal";

export function DayInstructions({
  cropType,
  currentDay = 0,
  batchId,
  hasCheckedInToday = false,
}: {
  cropType: string;
  currentDay?: number;
  batchId?: string;
  hasCheckedInToday?: boolean;
}) {
  const totalDays = CROP_CYCLE_DAYS[cropType as keyof typeof CROP_CYCLE_DAYS] || 9;
  const instructions = CROP_INSTRUCTIONS[cropType] || {};

  return (
    <div className="space-y-2">
      {Array.from({ length: totalDays }, (_, index) => {
        const day = index + 1;
        const isToday = day === currentDay + 1;
        const isDone = day <= currentDay;
        const isFuture = day > currentDay + 1;

        return (
          <div
            key={day}
            className={`rounded-xl border p-4 transition-all ${
              isToday
                ? "bg-sprout-50 border-sprout-500/30 shadow-sm"
                : isDone
                ? "bg-white/40 border-white/30"
                : "bg-white/30 border-white/20 opacity-60"
            }`}
          >
            <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:items-start min-[520px]:justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Day indicator */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${
                    isDone
                      ? "bg-sprout-100 text-sprout-700"
                      : isToday
                      ? "bg-sprout-800 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : day}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-text-primary text-sm">
                      Day {day}
                    </p>
                    {isToday && (
                      <span className="text-[10px] font-bold text-sprout-800 bg-sprout-200/50 px-2 py-0.5 rounded-full">
                        TODAY
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-semibold text-sprout-600">
                        Completed
                      </span>
                    )}
                    {isFuture && (
                      <span className="flex items-center gap-1 text-[10px] text-text-muted">
                        <Lock className="w-3 h-3" /> Upcoming
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {instructions[day] || "Water 150ml and monitor growth."}
                  </p>
                </div>
              </div>

              {/* Check-in button for today only */}
              {isToday && batchId && !hasCheckedInToday && (
                <div className="flex-shrink-0">
                  <CheckinModal batchId={batchId} day={day} />
                </div>
              )}
              {isToday && hasCheckedInToday && (
                <span className="flex items-center gap-1 text-xs font-semibold text-sprout-700 bg-sprout-100 px-3 py-1.5 rounded-lg flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
