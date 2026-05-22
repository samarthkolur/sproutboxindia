import Link from "next/link";
import { GlassCard } from "@/components/shared/GlassCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { prisma } from "@/lib/prisma";

export default async function AdminHubsPage() {
  const hubs = await prisma.hub.findMany({ include: { cluster: true }, orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-2xl sm:text-3xl font-black text-text-primary">Hubs</h1>
      {hubs.length ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 min-[480px]:grid-cols-2">
          {hubs.map((hub) => (
            <Link key={hub.id} href={`/admin/hubs/${hub.id}`}>
              <GlassCard hover>
                <h2 className="font-bold text-text-primary">{hub.name}</h2>
                <p className="mt-1 text-sm text-text-muted">{hub.cluster.name} · {hub.dropoffStart}-{hub.dropoffEnd}</p>
                <p className="mt-2 text-sm text-text-muted">{hub.address}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No hubs yet" description="Create hubs to aggregate approved harvests by cluster." />
      )}
    </div>
  );
}
