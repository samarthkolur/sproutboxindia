import type { LucideIcon } from "lucide-react";
import { Leaf } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon: Icon = Leaf, action }: EmptyStateProps) {
  return (
    <GlassCard>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sprout-100">
          <Icon className="h-6 w-6 text-sprout-700" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-text-muted">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </GlassCard>
  );
}
