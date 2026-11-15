import { cn } from "@/lib/utils";

// Tiny trend line with an area fill and an emphasised endpoint. Needs 2+ points.
export function Sparkline({
  values,
  className,
  tone = "leaf",
}: {
  values: number[];
  className?: string;
  tone?: "leaf" | "watch" | "brand";
}) {
  if (values.length < 2) return null;

  const width = 100;
  const height = 32;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${pad},${height} ${line} ${width - pad},${height}`;
  const [lastX, lastY] = points[points.length - 1];
  const stroke = { leaf: "stroke-leaf", watch: "stroke-watch", brand: "stroke-brand" }[tone];
  const fill = { leaf: "fill-leaf", watch: "fill-watch", brand: "fill-brand" }[tone];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("h-8 w-24", className)} aria-hidden="true" preserveAspectRatio="none">
      <polygon points={area} className={cn(fill, "opacity-15")} />
      <polyline points={line} fill="none" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" className={stroke} vectorEffect="non-scaling-stroke" />
      <circle cx={lastX} cy={lastY} r={2.2} className={fill} />
    </svg>
  );
}
