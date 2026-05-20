"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BarData {
  label: string;
  value: number;
  tooltip?: string;
}

interface MiniBarChartProps {
  data: BarData[];
  height?: number;
  barColor?: string;
  className?: string;
  suffix?: string;
}

export function MiniBarChart({
  data,
  height = 144,
  barColor = "from-sprout-700 to-sprout-400",
  className,
  suffix = "",
}: MiniBarChartProps) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("flex items-end gap-2", className)} style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
          {/* Tooltip */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
            <div className="bg-text-primary text-white text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
              {item.tooltip || `${item.value}${suffix}`}
            </div>
          </div>

          {/* Bar */}
          <div
            className={cn(
              "w-full bg-gradient-to-t rounded-lg transition-all duration-700 ease-out cursor-pointer",
              "hover:opacity-80 hover:shadow-lg hover:shadow-sprout-500/20",
              barColor
            )}
            style={{
              height: animated ? `${(item.value / maxVal) * 100}%` : "0%",
              transitionDelay: `${i * 80}ms`,
            }}
          />

          {/* Label */}
          <p className="text-[10px] text-text-muted mt-1.5 font-medium">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
