import type { LucideIcon } from "lucide-react";

export function FeatureList({ items }: { items: { icon: LucideIcon; title: string; description: string }[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.title} className="flex gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf-soft text-ink">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-0.5 text-sm text-ink-soft">{item.description}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
