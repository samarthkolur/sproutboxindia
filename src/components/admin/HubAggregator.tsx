import { GlassCard } from "@/components/shared/GlassCard";

export function HubAggregator({ expectedKg = 0, receivedKg = 0 }: { expectedKg?: number; receivedKg?: number }) {
  const percent = expectedKg > 0 ? Math.round((receivedKg / expectedKg) * 100) : 0;
  return (
    <GlassCard>
      <p className="text-sm text-text-muted">Hub aggregation</p>
      <p className="mt-2 text-3xl font-black text-text-primary">{receivedKg}kg / {expectedKg}kg</p>
      <div className="mt-4 h-2 rounded-full bg-sprout-100">
        <div className="h-2 rounded-full bg-sprout-700" style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
    </GlassCard>
  );
}
