import { GlassCard } from "@/components/shared/GlassCard";

export function SubscriptionCard({ title = "Weekly microgreens", status = "Active" }: { title?: string; status?: string }) {
  return (
    <GlassCard>
      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <div className="min-w-0">
          <h3 className="font-bold text-text-primary">{title}</h3>
          <p className="text-sm text-text-muted">Recurring supply plan</p>
        </div>
        <span className="w-fit rounded-full bg-sprout-100 px-3 py-1 text-xs font-bold text-sprout-800">{status}</span>
      </div>
    </GlassCard>
  );
}
