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

export function StatCard({
  label,
  value,
  change,
  changeType = "positive",
  icon,
  className,
}: StatCardProps) {
  const changeColors = {
    positive: "text-sprout-600",
    negative: "text-status-error",
    neutral: "text-text-muted",
  };

  const TrendIcon =
    changeType === "positive"
      ? TrendingUp
      : changeType === "negative"
        ? TrendingDown
        : Minus;

  return (
    <div className={cn("glass-card p-5 group hover:shadow-lg hover:shadow-sprout-500/10 transition-all duration-300", className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
          {label}
        </p>
        {icon && (
          <div className="w-9 h-9 bg-sprout-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-sprout-200 transition-colors duration-300">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-text-primary mb-1 tracking-tight">{value}</p>
      {change && (
        <div className={cn("flex items-center gap-1", changeColors[changeType])}>
          <TrendIcon className="w-3 h-3" strokeWidth={2.5} />
          <span className="text-xs font-semibold">{change}</span>
        </div>
      )}
    </div>
  );
}
