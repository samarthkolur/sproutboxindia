import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { prisma } from "@/lib/prisma";
import { CROP_DISPLAY_NAMES, TRAY_YIELD_GRAMS, DEFAULT_BUFFER_PERCENT, type CropType } from "@/lib/constants";
import { Settings2, ArrowRight, Package } from "lucide-react";

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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Settings2 className="w-7 h-7 text-sprout-700" />
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Demand Engine</h1>
        </div>
        <p className="text-text-secondary">Convert confirmed orders into production plans</p>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const traysNeeded = Math.ceil((order.quantityKg * 1000) / TRAY_YIELD_GRAMS);
            const bufferTrays = Math.ceil(traysNeeded * DEFAULT_BUFFER_PERCENT);
            const totalTrays = traysNeeded + bufferTrays;

            return (
              <GlassCard key={order.id}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-text-primary">
                        {order.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <StatusBadge status="active" />
                    </div>
                    <p className="text-sm text-text-muted">
                      {order.restaurant.businessName} · {CROP_DISPLAY_NAMES[order.cropType as CropType] || order.cropType} × {order.quantityKg}kg
                    </p>
                  </div>
                  <p className="text-sm text-text-muted">
                    Delivery: {order.deliveryDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-sprout-50/50 rounded-xl p-4 border border-sprout-200/30 mb-4">
                  <div>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">Base Trays</p>
                    <p className="text-xl font-black text-text-primary">{traysNeeded}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">Buffer ({Math.round(DEFAULT_BUFFER_PERCENT * 100)}%)</p>
                    <p className="text-xl font-black text-amber-600">+{bufferTrays}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">Total Trays</p>
                    <p className="text-xl font-black text-sprout-800">{totalTrays}</p>
                  </div>
                </div>

                <button className="w-full bg-sprout-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sprout-900 transition-all flex items-center justify-center gap-2">
                  Create Production Plan <ArrowRight className="w-4 h-4" />
                </button>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard>
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">No orders pending</h3>
            <p className="text-sm text-text-muted">All confirmed orders have production plans</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
