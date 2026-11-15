import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
}

// In-page tabs with the accent underline (Verdelo "In & out / Spending / Merchants").
export function Tabs({
  items,
  value,
  onChange,
  hrefFor,
  ariaLabel,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange?: (value: string) => void;
  hrefFor?: (value: string) => string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("scrollbar-none flex gap-6 overflow-x-auto border-b border-hairline", className)}>
      {items.map((item) => {
        const active = item.value === value;
        const classes = cn(
          "-mb-px shrink-0 border-b-2 pb-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
          active ? "border-brand text-ink" : "border-transparent text-ink-muted hover:text-ink"
        );
        return hrefFor ? (
          <Link key={item.value} role="tab" aria-selected={active} href={hrefFor(item.value)} className={classes}>
            {item.label}
          </Link>
        ) : (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-no-global-loading
            onClick={() => onChange?.(item.value)}
            className={classes}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
