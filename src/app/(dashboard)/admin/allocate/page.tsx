import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { AllocateClient } from "./AllocateClient";

export default async function AllocatePage() {
  const [plans, growers] = await Promise.all([
    prisma.productionPlan.findMany({
      where: { status: "DRAFT" },
      select: {
        id: true,
        totalTrays: true,
        bufferTrays: true,
        sowDate: true,
        harvestDate: true,
        order: { select: { cropType: true, quantityKg: true, deliveryDate: true, restaurant: { select: { businessName: true, city: true, lat: true, lng: true } } } },
      },
      orderBy: { order: { deliveryDate: "asc" } },
    }),
    prisma.grower.findMany({
      where: { isActive: true },
      select: {
        id: true,
        city: true,
        kitSize: true,
        compositeScore: true,
        lat: true,
        lng: true,
        fssaiVerifiedAt: true,
        user: { select: { name: true } },
        // Trays already growing, so a grower is never given more than their kit holds.
        tasks: { where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "HARVEST_READY"] } }, select: { trayCount: true } },
      },
      orderBy: { compositeScore: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader title="Allocate trays" subtitle="Give each production plan to growers who are close to the restaurant and have room." />
      <AllocateClient
        plans={plans}
        growers={growers.map((g) => ({
          id: g.id,
          name: g.user.name ?? "Grower",
          city: g.city,
          kitSize: g.kitSize,
          activeTrays: g.tasks.reduce((sum, t) => sum + t.trayCount, 0),
          compositeScore: g.compositeScore,
          lat: g.lat,
          lng: g.lng,
          fssaiVerified: g.fssaiVerifiedAt !== null,
        }))}
      />
    </>
  );
}
