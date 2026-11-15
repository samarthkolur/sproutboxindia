import type { LucideIcon } from "lucide-react";
import { Leaf } from "lucide-react";
import { Panel } from "@/components/ui/panel";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon: Icon = Leaf, action }: EmptyStateProps) {
  return (
    <Panel padding="lg">
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-leaf-soft">
          <Icon className="h-6 w-6 text-ink-soft" />
        </div>
        <h3 className="text-lg font-medium text-ink">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-ink-soft">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </Panel>
  );
}
