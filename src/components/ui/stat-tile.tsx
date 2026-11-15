import Link from "next/link";
import { cn } from "@/lib/utils";

type StatTone = "neutral" | "good" | "watch";

// Tint carries meaning (V1/Verdelo): good = on track, watch = look at this.
const TINT: Record<StatTone, string> = {
  neutral: "bg-panel/55",
  good: "bg-leaf-soft/70",
  watch: "bg-watch-soft/80",
};

// V2: label, big number, and a caption in plain words. The caption is required
// on purpose; a number without a sentence is what this tile exists to prevent.
export function StatTile({
  label,
  value,
  caption,
  icon,
  tone = "neutral",
  href,
  trailing,
  className,
}: {
  label: string;
  value: React.ReactNode;
  caption: React.ReactNode;
  icon?: React.ReactNode;
  tone?: StatTone;
  href?: string;
  /** Right-aligned slot, usually a <Sparkline />. */
  trailing?: React.ReactNode;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2 text-sm text-ink-soft">
        {icon ? <span className="text-ink-muted [&>svg]:h-4 [&>svg]:w-4">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-3xl font-light leading-none tracking-tight text-ink tabular-nums break-words">{value}</p>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
      <p className="mt-2 text-micro text-ink-muted">{caption}</p>
    </>
  );

  const classes = cn(
    "block rounded-tile border border-white/50 p-4 shadow-panel backdrop-blur-[2px] dark:border-white/5",
    TINT[tone],
    href && "transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
    className
  );

  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
