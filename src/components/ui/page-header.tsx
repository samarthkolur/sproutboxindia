import { cn } from "@/lib/utils";

// V2: every page opens with a title and ONE sentence that says what is going on.
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Small line above the title (a date on home pages). */
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-sm text-ink-muted">{eyebrow}</p> : null}
        <h1 className="text-3xl font-light tracking-tight text-ink text-balance sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-1.5 max-w-2xl text-sm text-ink-soft sm:text-base">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
