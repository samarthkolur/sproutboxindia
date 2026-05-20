import { GlassCard } from "@/components/shared/GlassCard";

export function SubscriptionCard({ title = "Weekly microgreens", status = "Active" }: { title?: string; status?: string }) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-text-primary">{title}</h3>
          <p className="text-sm text-text-muted">Recurring supply plan</p>
        </div>
        <span className="rounded-full bg-sprout-100 px-3 py-1 text-xs font-bold text-sprout-800">{status}</span>
      </div>
    </GlassCard>
  );
}
