import type { ReactNode } from "react";
import { Panel } from "@/components/ui/panel";

export function SummaryPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel padding="lg">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <dl className="mt-4 space-y-4">{children}</dl>
    </Panel>
  );
}

// V2: a figure always comes with a sentence saying what it means.
export function SummaryRow({ label, value, caption }: { label: string; value: ReactNode; caption?: string }) {
  return (
    <div>
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-2xl font-light tracking-tight text-ink">{value}</dd>
      {caption ? <dd className="mt-0.5 text-micro text-ink-muted">{caption}</dd> : null}
    </div>
  );
}
