"use client";

import { useId, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Choice {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  /** Right-aligned slot, e.g. a price. */
  trailing?: ReactNode;
}

type ChoiceGroupProps = {
  choices: Choice[];
  ariaLabel: string;
  /** Columns from the `sm` breakpoint up; always one column on a narrow phone unless `compact`. */
  columns?: 1 | 2 | 3;
  /** Keep the columns even on a phone (short labels only). */
  compact?: boolean;
  className?: string;
} & (
  | { multiple?: false; value: string; onChange: (value: string) => void }
  | { multiple: true; values: string[]; onChange: (values: string[]) => void }
);

const COLUMNS = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" };

// Selectable tiles for choices that deserve more than a dropdown (role, kit, crops).
// Real radio/checkbox inputs underneath, so the keyboard (arrows, space) and
// screen readers work without any extra code. V1: the chosen tile is the one solid accent.
export function ChoiceGroup(props: ChoiceGroupProps) {
  const { choices, ariaLabel, columns = 2, compact, className } = props;
  const name = useId();
  const multiple = props.multiple === true;

  const isSelected = (value: string) => (props.multiple ? props.values.includes(value) : props.value === value);

  function select(value: string) {
    if (props.multiple) {
      props.onChange(props.values.includes(value) ? props.values.filter((v) => v !== value) : [...props.values, value]);
    } else {
      props.onChange(value);
    }
  }

  return (
    <div
      role={multiple ? "group" : "radiogroup"}
      aria-label={ariaLabel}
      className={cn("grid gap-2.5", compact ? "grid-cols-2" : "grid-cols-1", COLUMNS[columns], className)}
    >
      {choices.map((choice) => {
        const selected = isSelected(choice.value);
        return (
          <label key={choice.value} className="relative block cursor-pointer">
            <input
              type={multiple ? "checkbox" : "radio"}
              name={name}
              value={choice.value}
              checked={selected}
              onChange={() => select(choice.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex h-full items-center gap-3 rounded-tile border p-3.5 transition-colors",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50",
                selected ? "border-brand bg-leaf-soft/70 shadow-panel" : "border-hairline bg-panel/60 hover:border-ink-muted/50"
              )}
            >
              {choice.icon ? <span className="shrink-0 text-ink-soft">{choice.icon}</span> : null}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">{choice.label}</span>
                {choice.description ? (
                  <span className="mt-0.5 block text-micro text-ink-muted">{choice.description}</span>
                ) : null}
              </span>
              {choice.trailing ? <span className="shrink-0 text-sm font-semibold text-ink">{choice.trailing}</span> : null}
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  selected ? "border-brand bg-brand text-brand-ink" : "border-hairline bg-transparent text-transparent"
                )}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
