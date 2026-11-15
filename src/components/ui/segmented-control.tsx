"use client";

import { cn } from "@/lib/utils";

export interface SegmentOption {
  value: string;
  label: string;
}

// V5: range pills sit beside the thing they change (a chart's period, a form's cadence).
// Active = the one solid fill (V1). Labels never ellipsize (Kannada/Hindi run long): the
// pill row scrolls sideways instead of cutting a word.
export function SegmentedControl({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-hairline bg-inset/50 p-1", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-no-global-loading
            onClick={() => onChange(option.value)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
              active ? "bg-brand text-brand-ink shadow-panel" : "text-ink-soft hover:text-ink"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
