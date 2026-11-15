import { cn } from "@/lib/utils";

type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
  /** Darker inset surface, for a panel inside a panel. */
  inset?: boolean;
};

const PADDING = {
  none: "",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-7",
};

// V3: translucent, tinted surface on the glow canvas. The only container primitive.
export function Panel({ className, padding = "md", inset = false, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        inset ? "rounded-2xl bg-inset/70" : "panel",
        PADDING[padding],
        className
      )}
      {...props}
    />
  );
}

export function PanelHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
