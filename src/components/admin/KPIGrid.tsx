import { StatCard } from "@/components/shared/StatCard";
import type { KPIStat } from "@/types";

export function KPIGrid({ stats }: { stats: KPIStat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} />
      ))}
    </div>
  );
}
