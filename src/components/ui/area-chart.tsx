"use client";

import { useId } from "react";
import { Area, AreaChart as RechartsArea, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface AreaDatum {
  label: string;
  value: number;
}

const TICK = { fill: "rgb(var(--c-ink-muted))", fontSize: 12 } as const;

// Smooth line with a soft area gradient, dotted horizontal grid and a tooltip (V4).
export function AreaChart({
  data,
  format = (value) => String(value),
  height = 240,
  seriesLabel,
  ariaLabel,
}: {
  data: AreaDatum[];
  format?: (value: number) => string;
  height?: number;
  seriesLabel: string;
  ariaLabel: string;
}) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <div role="img" aria-label={ariaLabel} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsArea data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--c-leaf))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="rgb(var(--c-leaf))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="rgb(var(--c-hairline))" />
          <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={TICK} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => format(v)} />
          <Tooltip
            cursor={{ stroke: "rgb(var(--c-ink-muted))", strokeDasharray: "3 3" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-xl bg-panel-solid px-3 py-2 text-micro shadow-pop ring-1 ring-hairline">
                  <p className="font-medium text-ink">{label}</p>
                  <p className="text-ink-soft">
                    {seriesLabel} <span className="font-medium tabular-nums text-ink">{format(Number(payload[0].value))}</span>
                  </p>
                </div>
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="rgb(var(--c-leaf))"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 4, fill: "rgb(var(--c-leaf))", stroke: "rgb(var(--c-panel-solid))", strokeWidth: 2 }}
          />
        </RechartsArea>
      </ResponsiveContainer>
    </div>
  );
}
