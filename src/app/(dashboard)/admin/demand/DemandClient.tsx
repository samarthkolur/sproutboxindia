"use client";

import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CROP_DISPLAY_NAMES, TRAY_YIELD_GRAMS, DEFAULT_BUFFER_PERCENT, type CropType } from "@/lib/constants";
import { ArrowRight, Package, Loader2 } from "lucide-react";
import { createProductionPlan } from "@/actions/demand.actions";

type OrderItem = {
  id: string;
  cropType: string;
  quantityKg: number;
  deliveryDate: Date;
  restaurant: {
    businessName: string;
  };
};

export function DemandClient({ initialOrders }: { initialOrders: OrderItem[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePlan = async (orderId: string) => {
    setProcessingId(orderId);
    setError(null);

    const res = await createProductionPlan(orderId);

    if (res?.error) {
      setError(res.error);
      setProcessingId(null);
    } else {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setProcessingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <GlassCard>
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            No orders pending
          </h3>
          <p className="text-sm text-text-muted">
            All confirmed orders have production plans
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}
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
                  {order.restaurant.businessName} ·{" "}
                  {CROP_DISPLAY_NAMES[order.cropType as CropType] || order.cropType} ×{" "}
                  {order.quantityKg}kg
                </p>
              </div>
              <p className="text-sm text-text-muted">
                Delivery:{" "}
                {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-sprout-50/50 rounded-xl p-4 border border-sprout-200/30 mb-4">
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">
                  Base Trays
                </p>
                <p className="text-xl font-black text-text-primary">{traysNeeded}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">
                  Buffer ({Math.round(DEFAULT_BUFFER_PERCENT * 100)}%)
                </p>
                <p className="text-xl font-black text-amber-600">+{bufferTrays}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">
                  Total Trays
                </p>
                <p className="text-xl font-black text-sprout-800">{totalTrays}</p>
              </div>
            </div>

            <button
              disabled={processingId === order.id}
              onClick={() => handleCreatePlan(order.id)}
              className="w-full bg-sprout-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sprout-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingId === order.id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  Create Production Plan <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </GlassCard>
        );
      })}
    </div>
  );
}
