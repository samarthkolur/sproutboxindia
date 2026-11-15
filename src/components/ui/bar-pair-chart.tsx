"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface BarPairDatum {
  label: string;
  a: number;
  b: number;
}

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

// Verdelo "Money in & out": paired bars per period with a ghost track behind
// each pair and a tooltip. Series A is the green bar, series B the muted one.
// Used for ordered vs delivered kg, revenue vs payouts, allocated vs harvested.
export function BarPairChart({
  data,
  aLabel,
  bLabel,
  format = (value) => String(value),
  height = 220,
  ariaLabel,
  className,
}: {
  data: BarPairDatum[];
  aLabel: string;
  bLabel: string;
  format?: (value: number) => string;
  height?: number;
  ariaLabel: string;
  className?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.flatMap((d) => [d.a, d.b]), 0));
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((t) => max * t);

  return (
    <div className={cn("flex gap-3", className)}>
      {/* y axis */}
      <div className="flex flex-col justify-between pb-6 text-micro tabular-nums text-ink-muted" style={{ height }} aria-hidden="true">
        {ticks.map((tick) => (
          <span key={tick}>{format(tick)}</span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div role="img" aria-label={ariaLabel} className="relative flex items-end gap-1.5" style={{ height }}>
          {/* gridlines */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden="true">
            {ticks.map((tick) => (
              <div key={tick} className="border-t border-dashed border-hairline/70" />
            ))}
          </div>

          {data.map((datum, index) => {
            const isActive = active === index;
            return (
              <div
                key={datum.label}
                tabIndex={0}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                className="relative flex h-full min-w-0 flex-1 flex-col outline-none"
              >
                <div className="relative flex-1 pb-0">
                  {/* ghost track */}
                  <div aria-hidden="true" className="absolute inset-x-0.5 bottom-6 top-0 rounded-full bg-inset/50" />
                  <div className="absolute inset-x-1 bottom-6 top-0 flex items-end justify-center gap-0.5">
                    <div
                      className="w-1/2 max-w-3 rounded-full bg-gradient-to-t from-leaf/70 to-leaf transition-opacity"
                      style={{ height: `${(datum.a / max) * 100}%`, opacity: active === null || isActive ? 1 : 0.55 }}
                    />
                    <div
                      className="w-1/2 max-w-3 rounded-full bg-ink-muted/40 transition-opacity"
                      style={{ height: `${(datum.b / max) * 100}%`, opacity: active === null || isActive ? 1 : 0.55 }}
                    />
                  </div>
                  {isActive && (
                    <div className="absolute left-1/2 top-1 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl bg-panel-solid px-3 py-2 text-micro shadow-pop ring-1 ring-hairline">
                      <p className="font-medium text-ink">{datum.label}</p>
                      <p className="text-ink-soft">
                        {aLabel} <span className="font-medium tabular-nums text-ink">{format(datum.a)}</span>
                      </p>
                      <p className="text-ink-soft">
                        {bLabel} <span className="font-medium tabular-nums text-ink">{format(datum.b)}</span>
                      </p>
                    </div>
                  )}
                </div>
                <span className={cn("h-6 truncate pt-1.5 text-center text-micro", isActive ? "font-medium text-ink" : "text-ink-muted")}>
                  {datum.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Screen-reader equivalent of the chart */}
        <table className="sr-only">
          <caption>{ariaLabel}</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">{aLabel}</th>
              <th scope="col">{bLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((datum) => (
              <tr key={datum.label}>
                <th scope="row">{datum.label}</th>
                <td>{format(datum.a)}</td>
                <td>{format(datum.b)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
