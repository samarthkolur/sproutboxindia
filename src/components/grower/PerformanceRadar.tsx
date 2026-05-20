"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

export function PerformanceRadar({ yieldScore, qualityScore, timelinessScore }: { yieldScore: number; qualityScore: number; timelinessScore: number }) {
  const data = [
    { metric: "Yield", score: Math.round(yieldScore * 100) },
    { metric: "Quality", score: Math.round(qualityScore * 100) },
    { metric: "Timing", score: Math.round(timelinessScore * 100) },
  ];
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <Radar dataKey="score" fill="#52B788" fillOpacity={0.45} stroke="#2D6A4F" />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
