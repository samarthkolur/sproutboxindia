import { notFound } from "next/navigation";
import { GlassCard } from "@/components/shared/GlassCard";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function AdminGrowerDetailPage({ params }: { params: { growerId: string } }) {
  const grower = await prisma.grower.findUnique({
    where: { id: params.growerId },
    include: { user: true, tasks: true, payouts: true },
  });
  if (!grower) notFound();

  return (
    <div className="space-y-6">
      <GlassCard>
        <h1 className="text-3xl font-black text-text-primary">{grower.user.name || grower.user.email}</h1>
        <p className="mt-2 text-text-muted">{grower.address}, {grower.city}</p>
      </GlassCard>
      <div className="grid gap-4 min-[480px]:grid-cols-2 md:grid-cols-4">
        <GlassCard><p className="text-sm text-text-muted">Composite</p><p className="text-2xl font-black">{Math.round(grower.compositeScore * 100)}%</p></GlassCard>
        <GlassCard><p className="text-sm text-text-muted">Yield</p><p className="text-2xl font-black">{Math.round(grower.yieldScore * 100)}%</p></GlassCard>
        <GlassCard><p className="text-sm text-text-muted">Quality</p><p className="text-2xl font-black">{Math.round(grower.qualityScore * 100)}%</p></GlassCard>
        <GlassCard><p className="text-sm text-text-muted">Earnings</p><p className="text-2xl font-black">{formatCurrency(grower.totalEarnings)}</p></GlassCard>
      </div>
    </div>
  );
}
