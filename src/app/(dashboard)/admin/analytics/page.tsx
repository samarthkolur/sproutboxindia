import { GlassCard } from "@/components/shared/GlassCard";
import { prisma } from "@/lib/prisma";
import { BarChart3, IndianRupee, Package, Users, Star, Sprout, TrendingUp } from "lucide-react";
import { OrderStatus } from "@prisma/client";

async function getAnalytics() {
  try {
    const [orderCount, totalRevenue, fulfilledRevenue, growerPayouts, growerCount, avgRating, trayCount] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalPrice: true } }),
      // Commission is only earned on orders that actually got paid for —
      // PENDING_PAYMENT/cancelled orders never converted to real revenue.
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { status: { notIn: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED] } },
      }),
      prisma.payout.aggregate({ _sum: { amount: true } }),
      prisma.grower.count({ where: { isActive: true } }),
      prisma.feedback.aggregate({ _avg: { rating: true } }),
      prisma.batch.count(),
    ]);

    const fulfilled = fulfilledRevenue._sum.totalPrice || 0;
    const payouts = growerPayouts._sum.amount || 0;
    const commission = fulfilled - payouts;
    const commissionRate = fulfilled > 0 ? (commission / fulfilled) * 100 : 0;

    return {
      orderCount,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      fulfilledRevenue: fulfilled,
      growerPayouts: payouts,
      commission,
      commissionRate,
      growerCount,
      avgRating: avgRating._avg.rating || 0,
      trayCount,
    };
  } catch {
    return {
      orderCount: 0,
      totalRevenue: 0,
      fulfilledRevenue: 0,
      growerPayouts: 0,
      commission: 0,
      commissionRate: 0,
      growerCount: 0,
      avgRating: 0,
      trayCount: 0,
    };
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  const metrics = [
    { label: "Total Orders", value: data.orderCount, icon: <Package className="w-6 h-6 text-blue-600" />, bg: "bg-blue-50" },
    { label: "Total Revenue", value: `₹${data.totalRevenue.toLocaleString("en-IN")}`, icon: <IndianRupee className="w-6 h-6 text-sprout-600" />, bg: "bg-sprout-50" },
    { label: "Active Growers", value: data.growerCount, icon: <Users className="w-6 h-6 text-purple-600" />, bg: "bg-purple-50" },
    { label: "Avg Rating", value: data.avgRating > 0 ? data.avgRating.toFixed(1) : "--", icon: <Star className="w-6 h-6 text-amber-600" />, bg: "bg-amber-50" },
    { label: "Total Trays", value: data.trayCount, icon: <Sprout className="w-6 h-6 text-sprout-600" />, bg: "bg-sprout-50" },
  ];

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-1">
          <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 text-sprout-700 flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">Analytics</h1>
        </div>
        <p className="text-sm sm:text-base text-text-secondary">Platform-wide performance metrics</p>
      </div>

      <div className="mb-6 sm:mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {metrics.map((m) => (
          <GlassCard key={m.label}>
            <div className={`w-12 h-12 ${m.bg} rounded-xl flex items-center justify-center mb-3`}>
              {m.icon}
            </div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-2xl font-black text-text-primary">{m.value}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="mb-5 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-sprout-700" />
          <h2 className="text-lg font-bold text-text-primary">Revenue Breakdown</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/50 bg-white/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
              Fulfilled Order Revenue
            </p>
            <p className="text-2xl font-black text-text-primary">
              ₹{data.fulfilledRevenue.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-text-muted">Excludes unpaid / cancelled orders</p>
          </div>
          <div className="rounded-xl border border-white/50 bg-white/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
              Grower Payouts
            </p>
            <p className="text-2xl font-black text-text-primary">
              ₹{data.growerPayouts.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-text-muted">Sum of all created payouts</p>
          </div>
          <div className="rounded-xl border border-sprout-200/60 bg-sprout-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-sprout-800 mb-1">
              Platform Commission
            </p>
            <p className="text-2xl font-black text-sprout-800">
              ₹{data.commission.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-sprout-700">
              {data.commissionRate.toFixed(1)}% of fulfilled revenue
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-text-muted">
          Commission = fulfilled order revenue − grower payouts. It is not yet split out per-order
          or per-crop; this is a platform-wide figure.
        </p>
      </GlassCard>
    </div>
  );
}
