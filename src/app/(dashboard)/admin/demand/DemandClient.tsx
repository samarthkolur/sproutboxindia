"use client";

import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  CROP_DISPLAY_NAMES,
  TRAY_YIELD_GRAMS,
  DEFAULT_BUFFER_PERCENT,
  CROP_CYCLE_DAYS,
  type CropType,
} from "@/lib/constants";
import { ArrowRight, Package, Loader2, Check, Target } from "lucide-react";
import { createProductionPlan } from "@/actions/demand.actions";
import Link from "next/link";

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
  const [createdPlanIds, setCreatedPlanIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePlan = async (orderId: string) => {
    setProcessingId(orderId);
    setError(null);

    const res = await createProductionPlan(orderId);

    if (res?.error) {
      setError(res.error);
      setProcessingId(null);
    } else {
      setCreatedPlanIds((prev) => [...prev, orderId]);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Success banner with CTA to allocate */}
      {createdPlanIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-sprout-500/30 bg-sprout-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-sprout-700 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-sprout-900">
                {createdPlanIds.length} production plan{createdPlanIds.length > 1 ? "s" : ""} created
              </p>
              <p className="text-xs text-sprout-700 mt-0.5">
                Ready to assign trays to growers
              </p>
            </div>
          </div>
          <Link
            href="/admin/allocate"
            className="flex items-center gap-2 bg-sprout-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-sprout-900 transition-all hover:shadow-lg hover:shadow-sprout-800/20 flex-shrink-0"
          >
            <Target className="w-4 h-4" />
            Allocate Now
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
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
      ) : (
        orders.map((order) => {
          const traysNeeded = Math.ceil((order.quantityKg * 1000) / TRAY_YIELD_GRAMS);
          const bufferTrays = Math.ceil(traysNeeded * DEFAULT_BUFFER_PERCENT);
          const totalTrays = traysNeeded + bufferTrays;
          const cycleDays =
            CROP_CYCLE_DAYS[order.cropType as CropType] ?? 9;

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
                <div className="text-right">
                  <p className="text-sm text-text-muted">
                    Delivery:{" "}
                    {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {cycleDays}-day cycle
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-sprout-50/50 rounded-xl p-4 border border-sprout-200/30 mb-4">
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
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    Create Production Plan <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </GlassCard>
          );
        })
      )}
    </div>
  );
}
