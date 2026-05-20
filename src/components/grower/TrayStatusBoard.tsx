import { GlassCard } from "@/components/shared/GlassCard";

export function TrayStatusBoard({ columns }: { columns: Record<string, number> }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Object.entries(columns).map(([label, count]) => (
        <GlassCard key={label}>
          <p className="text-sm font-semibold text-text-muted">{label}</p>
          <p className="mt-2 text-3xl font-black text-text-primary">{count}</p>
        </GlassCard>
      ))}
    </div>
  );
}
