import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Numbered pills joined by a line: the steps are a real sequence. Only the current
// step shows its label, and only from `sm` up (the step heading below names it on a
// phone); every label stays available to screen readers. That keeps six steps on one
// line at 375px, in Kannada too.
export function WizardStepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label="Progress" className="flex items-center">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        const last = index === steps.length - 1;
        return (
          <li key={label} aria-current={active ? "step" : undefined} className={cn("flex items-center", !last && "flex-auto")}>
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-micro font-semibold transition-colors",
                done && "bg-leaf text-white",
                active && "bg-brand text-brand-ink ring-4 ring-brand/15",
                !done && !active && "bg-inset text-ink-muted"
              )}
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : index + 1}
            </span>
            <span className={cn(active ? "sr-only sm:not-sr-only sm:ml-2 sm:whitespace-nowrap sm:text-sm sm:font-medium sm:text-ink" : "sr-only")}>
              {label}
            </span>
            {!last && <span aria-hidden="true" className={cn("mx-1.5 h-px min-w-2 flex-1 sm:mx-2", done ? "bg-leaf" : "bg-hairline")} />}
          </li>
        );
      })}
    </ol>
  );
}
