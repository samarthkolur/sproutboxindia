import { cn } from "@/lib/utils";
import { Panel } from "./panel";

// V4: charts are the content. Title and one-line subtitle on the left, the
// range control on the right (V5), legend with totals underneath.
export function ChartCard({
  title,
  subtitle,
  controls,
  legend,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  controls?: React.ReactNode;
  legend?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Panel className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p> : null}
        </div>
        {controls ? <div className="max-w-full shrink-0 overflow-x-auto">{controls}</div> : null}
      </div>
      {legend ? <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">{legend}</div> : null}
      <div className="mt-4 min-h-0 flex-1">{children}</div>
    </Panel>
  );
}

export function LegendItem({
  swatch,
  label,
  value,
}: {
  swatch: "leaf" | "muted" | "watch" | "brand";
  label: string;
  value?: string;
}) {
  const color = { leaf: "bg-leaf", muted: "bg-ink-muted/50", watch: "bg-watch", brand: "bg-brand" }[swatch];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", color)} />
      <span>{label}</span>
      {value ? <span className="font-medium tabular-nums text-ink">{value}</span> : null}
    </span>
  );
}
