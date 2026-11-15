import { cn } from "@/lib/utils";

type MeterTone = "leaf" | "brand" | "watch" | "risk";

const FILL: Record<MeterTone, string> = {
  leaf: "bg-leaf",
  brand: "bg-brand",
  watch: "bg-watch",
  risk: "bg-risk",
};

// "thick" carries its value inside the bar (Grovia); "thin" is a used/total meter.
export function Meter({
  value,
  max = 100,
  tone = "leaf",
  size = "thin",
  label,
  className,
}: {
  value: number;
  max?: number;
  tone?: MeterTone;
  size?: "thin" | "thick";
  label?: string;
  className?: string;
}) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-label={label}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-inset",
        size === "thick" ? "h-7" : "h-1.5",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none", FILL[tone])}
        style={{ width: `${percent}%` }}
      />
      {size === "thick" && percent >= 12 ? (
        <span className="absolute inset-y-0 left-3 flex items-center text-micro font-medium tabular-nums text-white">
          {Math.round(percent)}%
        </span>
      ) : null}
    </div>
  );
}
