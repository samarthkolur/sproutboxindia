import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { DemandClient } from "./DemandClient";

export default async function DemandEnginePage() {
  const orders = await prisma.order.findMany({
    where: { status: "CONFIRMED", productionPlan: null },
    select: { id: true, cropType: true, quantityKg: true, deliveryDate: true, restaurant: { select: { businessName: true } } },
    orderBy: { deliveryDate: "asc" },
  });

  return (
    <>
      <PageHeader title="Demand engine" subtitle="Turn paid orders into production plans, nearest delivery first." />
      <DemandClient orders={orders} />
    </>
  );
}
