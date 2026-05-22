import { prisma } from "@/lib/prisma";
import { Settings2 } from "lucide-react";
import { DemandClient } from "./DemandClient";

async function getPendingOrders() {
  try {
    return await prisma.order.findMany({
      where: { status: "CONFIRMED", productionPlan: null },
      include: { restaurant: { select: { businessName: true } } },
      orderBy: { deliveryDate: "asc" },
    });
  } catch { return []; }
}

export default async function DemandEnginePage() {
  const orders = await getPendingOrders();

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-1">
          <Settings2 className="w-6 h-6 sm:w-7 sm:h-7 text-sprout-700 flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">Demand Engine</h1>
        </div>
        <p className="text-sm sm:text-base text-text-secondary">Convert confirmed orders into production plans</p>
      </div>

      <DemandClient initialOrders={orders} />
    </div>
  );
}
