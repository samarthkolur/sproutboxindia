import Link from "next/link";
import { GlassCard } from "@/components/shared/GlassCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { prisma } from "@/lib/prisma";

export default async function AdminGrowersPage() {
  const growers = await prisma.grower.findMany({ include: { user: true, cluster: true }, orderBy: { compositeScore: "desc" } });

  return (
    <div>
      <h1 className="mb-6 text-2xl sm:text-3xl font-black text-text-primary">Growers</h1>
      {growers.length ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-3">
          {growers.map((grower) => (
            <Link key={grower.id} href={`/admin/growers/${grower.id}`}>
              <GlassCard hover>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold text-text-primary">{grower.user.name || grower.user.email}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      grower.fssaiVerifiedAt
                        ? "bg-sprout-100 text-sprout-700"
                        : grower.fssaiRegNumber
                          ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                    }`}
                  >
                    {grower.fssaiVerifiedAt ? "FSSAI verified" : grower.fssaiRegNumber ? "FSSAI pending" : "No FSSAI"}
                  </span>
                </div>
                <p className="text-sm text-text-muted">{grower.city} · {grower.kitSize} trays</p>
                <p className="mt-3 text-2xl font-black text-sprout-800">{Math.round(grower.compositeScore * 100)}%</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No growers yet" description="Grower profiles will appear after onboarding." />
      )}
    </div>
  );
}
