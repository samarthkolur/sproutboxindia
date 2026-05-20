"use client";

import { cn } from "@/lib/utils";

interface StepProgressProps {
  steps: string[];
  currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <div key={step} className="flex-1 flex flex-col items-center">
            {/* Line + dot */}
            <div className="flex items-center w-full">
              {i > 0 && (
                <div
                  className={cn(
                    "flex-1 h-[2px] transition-colors duration-300",
                    isCompleted ? "bg-sprout-600" : "bg-sprout-200/50"
                  )}
                />
              )}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0",
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
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-[2px] transition-colors duration-300",
                    isCompleted ? "bg-sprout-600" : "bg-sprout-200/50"
                  )}
                />
              )}
            </div>
            {/* Label */}
            <span
              className={cn(
                "text-[10px] font-semibold mt-2 text-center transition-colors",
                isCurrent ? "text-sprout-800" : isCompleted ? "text-sprout-600" : "text-text-muted"
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
