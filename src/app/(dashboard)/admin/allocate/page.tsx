import { GlassCard } from "@/components/shared/GlassCard";
import { prisma } from "@/lib/prisma";
import { Target, Users } from "lucide-react";

async function getGrowersForAllocation() {
  try {
    return await prisma.grower.findMany({
      where: { isActive: true },
      include: { user: { select: { name: true } }, _count: { select: { tasks: true } } },
      orderBy: { compositeScore: "desc" },
    });
  } catch { return []; }
}

export default async function AllocatePage() {
  const growers = await getGrowersForAllocation();

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Target className="w-7 h-7 text-sprout-700" />
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Allocations</h1>
        </div>
        <p className="text-text-secondary">Assign production tasks to growers based on scores</p>
      </div>

      {growers.length > 0 ? (
        <GlassCard>
          <h2 className="text-lg font-bold text-text-primary mb-5">Grower Rankings</h2>
          <div className="space-y-3">
            {growers.map((g, i) => (
              <div key={g.id} className="flex items-center gap-4 bg-white/50 rounded-xl p-4 border border-white/40 row-hover">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-gray-100 text-gray-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-sprout-50 text-text-muted"
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{g.user.name || "Unknown"}</p>
                  <p className="text-xs text-text-muted">{g.city} · Kit: {g.kitSize} trays · {g._count.tasks} tasks</p>
                </div>
                <div className="w-32">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted">Score</span>
                    <span className="font-bold text-sprout-700">{Math.round(g.compositeScore * 100)}</span>
                  </div>
                  <div className="w-full bg-sprout-100 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-sprout-600 to-sprout-400 h-1.5 rounded-full" style={{ width: `${g.compositeScore * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">No growers registered</h3>
            <p className="text-sm text-text-muted">Growers will appear here once they sign up</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
