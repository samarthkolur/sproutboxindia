import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

// Legacy stat card (restyled onto the new tokens). New pages use <StatTile>,
// which requires a plain-language caption (V2).
export function StatCard({
  label,
  value,
  change,
  changeType = "positive",
  icon,
  className,
}: StatCardProps) {
  const changeColors = {
    positive: "text-good",
    negative: "text-risk",
    neutral: "text-ink-muted",
  };

  const TrendIcon =
    changeType === "positive" ? TrendingUp : changeType === "negative" ? TrendingDown : Minus;

  return (
    <div className={cn("rounded-tile border border-white/50 bg-panel/55 p-4 shadow-panel sm:p-5", className)}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-sm leading-tight text-ink-soft">{label}</p>
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-leaf-soft text-ink-soft">
            {icon}
          </div>
        )}
      </div>
      <p className="mb-1 break-words text-2xl font-light tracking-tight text-ink tabular-nums sm:text-3xl">{value}</p>
      {change && (
        <div className={cn("flex items-center gap-1", changeColors[changeType])}>
          <TrendIcon className="h-3 w-3" strokeWidth={2.5} />
          <span className="text-micro font-medium">{change}</span>
        </div>
      )}
    </div>
  );
}
