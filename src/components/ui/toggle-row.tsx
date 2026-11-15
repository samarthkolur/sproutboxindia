import { cn } from "@/lib/utils";

// V5: the switch sits right beside the setting it changes, with a one-line explanation.
export function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
  className,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3", className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        {description ? <p className="mt-0.5 text-micro text-ink-muted">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        data-no-global-loading
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50",
          checked ? "bg-brand" : "bg-inset"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full shadow transition-[left] duration-150 motion-reduce:transition-none",
            checked ? "left-6 bg-brand-ink" : "left-1 bg-white"
          )}
        />
      </button>
    </div>
  );
}
