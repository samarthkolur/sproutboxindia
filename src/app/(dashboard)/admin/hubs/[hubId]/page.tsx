import { notFound } from "next/navigation";
import { HubAggregator } from "@/components/admin/HubAggregator";
import { GlassCard } from "@/components/shared/GlassCard";
import { prisma } from "@/lib/prisma";

export default async function AdminHubDetailPage({ params }: { params: { hubId: string } }) {
  const hub = await prisma.hub.findUnique({ where: { id: params.hubId }, include: { cluster: { include: { growers: { include: { user: true } } } } } });
  if (!hub) notFound();

  return (
    <div className="space-y-6">
      <GlassCard>
        <h1 className="text-3xl font-black text-text-primary">{hub.name}</h1>
        <p className="mt-2 text-text-muted">{hub.address}</p>
      </GlassCard>
      <HubAggregator expectedKg={25} receivedKg={0} />
      <GlassCard>
        <h2 className="mb-4 font-bold text-text-primary">Assigned growers</h2>
        <div className="space-y-2">
          {hub.cluster.growers.map((grower) => (
            <p key={grower.id} className="rounded-xl bg-white/60 p-3 text-sm text-text-primary">{grower.user.name || grower.user.email}</p>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
