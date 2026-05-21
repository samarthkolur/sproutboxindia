import { GlassCard } from "@/components/shared/GlassCard";
import { prisma } from "@/lib/prisma";
import { Truck, MapPin } from "lucide-react";

async function getDeliveries() {
  try {
    return await prisma.delivery.findMany({
      include: { order: { include: { restaurant: { select: { businessName: true, address: true } } } }, hub: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch { return []; }
}

const statusSteps = ["PREPARING", "PACKED", "IN_TRANSIT", "DELIVERED"];
const statusLabels: Record<string, string> = { PREPARING: "Preparing", PACKED: "Packed", IN_TRANSIT: "In Transit", DELIVERED: "Delivered", FAILED: "Failed" };

export default async function DeliveriesPage() {
  const deliveries = await getDeliveries();

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Truck className="w-7 h-7 text-sprout-700" />
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Deliveries</h1>
        </div>
        <p className="text-text-secondary">Track all deliveries from hub to restaurant</p>
      </div>

      {deliveries.length > 0 ? (
        <div className="space-y-4">
          {deliveries.map((d) => {
            const currentStep = statusSteps.indexOf(d.status);
            return (
              <GlassCard key={d.id}>
                <div className="mb-4 flex flex-col gap-2 min-[420px]:flex-row min-[420px]:items-start min-[420px]:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{d.order.restaurant.businessName}</p>
                    <p className="text-xs text-text-muted flex items-center gap-1"><MapPin className="w-3 h-3" /> {d.hub.name}</p>
                  </div>
                  <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                    d.status === "DELIVERED" ? "bg-sprout-50 text-sprout-700" :
                    d.status === "IN_TRANSIT" ? "bg-blue-50 text-blue-700" :
                    d.status === "FAILED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                  }`}>{statusLabels[d.status]}</span>
                </div>
                {/* Progress pipeline */}
                <div className="flex items-center gap-1 mb-3">
                  {statusSteps.map((step, i) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`w-full h-1.5 rounded-full ${i <= currentStep ? "bg-sprout-500" : "bg-sprout-100"}`} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between gap-2 text-[9px] text-text-muted min-[420px]:text-[10px]">
                  {statusSteps.map((step) => <span key={step}>{statusLabels[step]}</span>)}
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard>
          <div className="text-center py-16">
            <Truck className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">No deliveries</h3>
            <p className="text-sm text-text-muted">Deliveries will appear once orders are dispatched from hubs</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
