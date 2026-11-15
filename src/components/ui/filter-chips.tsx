import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FilterChip {
  value: string;
  label: string;
  count?: number;
}

// People-style filter row (Grovia): pills with counts. Two modes:
//  - onChange: client-side filtering
//  - hrefFor:  server-side filtering through the URL (links)
export function FilterChips({
  chips,
  value,
  onChange,
  hrefFor,
  ariaLabel,
  className,
}: {
  chips: FilterChip[];
  value: string;
  onChange?: (value: string) => void;
  hrefFor?: (value: string) => string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => {
        const active = chip.value === value;
        const classes = cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
          active
            ? "border-transparent bg-brand text-brand-ink"
            : "border-hairline bg-panel/60 text-ink-soft hover:text-ink"
        );
        const content = (
          <>
            <span>{chip.label}</span>
            {typeof chip.count === "number" && (
              <span className={cn("text-micro tabular-nums", active ? "text-brand-ink/70" : "text-ink-muted")}>
                {chip.count}
              </span>
            )}
          </>
        );
        return hrefFor ? (
          <Link key={chip.value} href={hrefFor(chip.value)} aria-current={active ? "true" : undefined} className={classes}>
            {content}
          </Link>
        ) : (
          <button
            key={chip.value}
            type="button"
            data-no-global-loading
            aria-pressed={active}
            onClick={() => onChange?.(chip.value)}
            className={classes}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
