import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export interface ReviewSection {
  title: string;
  /** The wizard step to jump back to. */
  step: number;
  rows: { label: string; value: ReactNode }[];
}

// Final step: everything entered, grouped by the step it came from, each with an Edit
// shortcut, so a mistake does not mean pressing Back four times.
export function ReviewList({ sections, onEdit }: { sections: ReviewSection[]; onEdit: (step: number) => void }) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <section key={section.title} className="rounded-tile border border-hairline bg-panel/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-ink">{section.title}</h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(section.step)} className="rounded-full">
              Edit
              <span className="sr-only">{section.title}</span>
            </Button>
          </div>
          <dl className="mt-2 space-y-2">
            {section.rows.map((row) => (
              <div key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="shrink-0 text-sm text-ink-muted">{row.label}</dt>
                <dd className="break-words text-sm font-medium text-ink sm:text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
