import { CROP_CYCLE_DAYS, CROP_INSTRUCTIONS } from "@/lib/constants";

export function DayInstructions({ cropType, currentDay = 0 }: { cropType: string; currentDay?: number }) {
  const totalDays = CROP_CYCLE_DAYS[cropType as keyof typeof CROP_CYCLE_DAYS] || 9;
  const instructions = CROP_INSTRUCTIONS[cropType] || {};

  return (
    <div className="space-y-2">
      {Array.from({ length: totalDays }, (_, index) => {
        const day = index + 1;
        const isToday = day === currentDay + 1;
        const isDone = day <= currentDay;
        return (
          <div key={day} className="rounded-xl border border-sprout-800/10 bg-white/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-text-primary">Day {day}</p>
              <span className="text-xs font-semibold text-text-muted">
                {isDone ? "Completed" : isToday ? "Today" : "Locked"}
              </span>
            </div>
            <p className="mt-1 text-sm text-text-muted">{instructions[day] || "Water 150ml and monitor growth."}</p>
          </div>
        );
      })}
    </div>
  );
}
