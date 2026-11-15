"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

const TICK = { fill: "rgb(var(--c-ink-soft))", fontSize: 13 } as const;

// Three scores on one shape. The numbers sit in the tiles beside it, so the chart is a
// picture of the balance and is hidden from assistive tech rather than read out twice.
export function PerformanceRadar({ yieldScore, qualityScore, timelinessScore }: { yieldScore: number; qualityScore: number; timelinessScore: number }) {
  const data = [
    { metric: "Yield", score: Math.round(yieldScore * 100) },
    { metric: "Quality", score: Math.round(qualityScore * 100) },
    { metric: "Timing", score: Math.round(timelinessScore * 100) },
  ];
  return (
    <div aria-hidden="true" className="h-56">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgb(var(--c-hairline))" />
          <PolarAngleAxis dataKey="metric" tick={TICK} />
          <Radar dataKey="score" fill="rgb(var(--c-leaf))" fillOpacity={0.35} stroke="rgb(var(--c-leaf))" strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
