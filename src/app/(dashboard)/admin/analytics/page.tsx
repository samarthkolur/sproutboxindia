import { GlassCard } from "@/components/shared/GlassCard";
import { prisma } from "@/lib/prisma";
import { BarChart3, IndianRupee, Package, Users, Star, Sprout } from "lucide-react";

async function getAnalytics() {
  try {
    const [orderCount, totalRevenue, growerCount, avgRating, trayCount] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalPrice: true } }),
      prisma.grower.count({ where: { isActive: true } }),
      prisma.feedback.aggregate({ _avg: { rating: true } }),
      prisma.batch.count(),
    ]);
    return {
      orderCount,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      growerCount,
      avgRating: avgRating._avg.rating || 0,
      trayCount,
    };
  } catch {
    return { orderCount: 0, totalRevenue: 0, growerCount: 0, avgRating: 0, trayCount: 0 };
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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="w-7 h-7 text-sprout-700" />
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Analytics</h1>
        </div>
        <p className="text-text-secondary">Platform-wide performance metrics</p>
      </div>

      <div className="mb-8 grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-5">
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
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-1">Detailed charts coming soon</h3>
          <p className="text-sm text-text-muted">Revenue trends, production volume, QC rates, and leaderboards</p>
        </div>
      </GlassCard>
    </div>
  );
}
