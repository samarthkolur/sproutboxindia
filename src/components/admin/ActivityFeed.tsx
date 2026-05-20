import { GlassCard } from "@/components/shared/GlassCard";

export function ActivityFeed({ items }: { items: { id: string; title: string; message: string }[] }) {
  return (
    <GlassCard>
      <h3 className="mb-4 font-bold text-text-primary">Activity</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl bg-white/60 p-3">
            <p className="text-sm font-semibold text-text-primary">{item.title}</p>
            <p className="text-xs text-text-muted">{item.message}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
