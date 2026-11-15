import { cn } from "@/lib/utils";

// Thin ring dial (grow-cycle progress). Server-renderable: no animation state.
export function Ring({
  percent,
  size = 96,
  strokeWidth = 7,
  tone = "leaf",
  className,
  children,
  label,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  tone?: "leaf" | "brand" | "watch" | "risk";
  className?: string;
  children?: React.ReactNode;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const stroke = { leaf: "stroke-leaf", brand: "stroke-brand", watch: "stroke-watch", risk: "stroke-risk" }[tone];

  return (
    <div
      role="img"
      aria-label={label ?? `${Math.round(clamped)}%`}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-inset" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (clamped / 100) * circumference}
          className={cn(stroke, "transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none")}
        />
      </svg>
      {children ? <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div> : null}
    </div>
  );
}
