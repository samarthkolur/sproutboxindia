import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  key: string;
  title: string;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  state: "done" | "current" | "upcoming";
}

// A real sequence (delivery steps, grow days), so the order carries information.
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("relative space-y-0", className)}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <li key={item.key} className="relative flex gap-3 pb-5 last:pb-0" aria-current={item.state === "current" ? "step" : undefined}>
            {!last && (
              <span
                aria-hidden="true"
                className={cn("absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px", item.state === "done" ? "bg-leaf" : "bg-hairline")}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-micro font-semibold",
                item.state === "done" && "bg-leaf text-white",
                item.state === "current" && "bg-brand text-brand-ink ring-4 ring-brand/15",
                item.state === "upcoming" && "bg-inset text-ink-muted"
              )}
            >
              {item.state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className={cn("text-sm font-medium", item.state === "upcoming" ? "text-ink-muted" : "text-ink")}>{item.title}</p>
                {item.meta ? <span className="text-micro text-ink-muted">{item.meta}</span> : null}
              </div>
              {item.description ? <div className="mt-0.5 text-sm text-ink-soft">{item.description}</div> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
