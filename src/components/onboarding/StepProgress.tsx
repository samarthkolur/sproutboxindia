"use client";

import { cn } from "@/lib/utils";

interface StepProgressProps {
  steps: string[];
  currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  const progress =
    steps.length > 1 ? `${(currentStep / (steps.length - 1)) * 100}%` : "0%";

  return (
    <div className="mb-8">
      <div className="relative">
        <div className="absolute left-4 right-4 top-4 h-[2px] rounded-full bg-sprout-100">
          <div
            className="h-full rounded-full bg-sprout-600 transition-all duration-300"
            style={{ width: progress }}
          />
        </div>
        <div
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((step, i) => {
            const isCompleted = i < currentStep;
            const isCurrent = i === currentStep;

            return (
            <div key={step} className="flex min-w-0 flex-col items-center">
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                  isCompleted
                    ? "bg-sprout-600 text-white shadow-md shadow-sprout-600/20"
                    : isCurrent
                    ? "bg-sprout-800 text-white shadow-lg shadow-sprout-800/25 scale-110"
                    : "bg-white/60 text-text-muted border border-white/40"
                )}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
            <span
              className={cn(
                "mt-2 max-w-16 truncate text-center text-[10px] font-semibold transition-colors",
                isCurrent ? "text-sprout-800" : isCompleted ? "text-sprout-600" : "text-text-muted"
              )}
              title={step}
            >
              {step}
            </span>
          </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
