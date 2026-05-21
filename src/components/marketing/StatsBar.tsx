import { GlassCard } from "@/components/shared/GlassCard";

const stats = [
  ["200+", "Active Growers"],
  ["3", "Cities"],
  ["500kg", "Delivered/week"],
  ["12", "Restaurants"],
];

export function StatsBar() {
  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <GlassCard className="mx-auto grid max-w-5xl gap-4 text-center min-[420px]:grid-cols-2 md:grid-cols-4">
        {stats.map(([value, label]) => (
          <div key={label}>
            <p className="text-3xl font-black text-sprout-800">{value}</p>
            <p className="text-sm text-text-muted">{label}</p>
          </div>
        ))}
      </GlassCard>
    </section>
  );
}
