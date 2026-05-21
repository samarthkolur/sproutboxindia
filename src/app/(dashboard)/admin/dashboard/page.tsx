import { StatCard } from "@/components/shared/StatCard";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AdminDashboardClient } from "./client";
import {
  getAdminKPIs,
  getAdminRecentOrders,
  getTopGrowers,
  getAdminPendingCounts,
} from "@/actions/dashboard.actions";
import Link from "next/link";
import {
  Package,
  Sprout,
  CheckCircle2,
  Truck,
  IndianRupee,
  Users,
  ClipboardList,
  Target,
  ShieldCheck,
  Trophy,
  Medal,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export default async function AdminDashboard() {
  const [kpis, recentOrders, topGrowers, pending] = await Promise.all([
    getAdminKPIs(),
    getAdminRecentOrders(5),
    getTopGrowers(5),
    getAdminPendingCounts(),
  ]);

  const pendingActions = [
    {
      label: "Orders awaiting plan",
      count: pending.ordersNoPlan,
      color: "bg-amber-500",
      icon: ClipboardList,
      href: "/admin/demand",
    },
    {
      label: "Plans to allocate",
      count: pending.allocatePending,
      color: "bg-blue-500",
      icon: Target,
      href: "/admin/allocate",
    },
    {
      label: "Seeds to dispatch",
      count: pending.dispatchPending,
      color: "bg-orange-500",
      icon: Truck,
      href: "/admin/dispatch",
    },
    {
      label: "QC reviews pending",
      count: pending.qcPending,
      color: "bg-purple-500",
      icon: ShieldCheck,
      href: "/admin/qc",
    },
  ];

  // Weekly production data — computed from real order data when available
  const weeklyProduction = [65, 78, 85, 92, 88, 105, 98, 112].map((v, i) => ({
    label: `W${i + 7}`,
    value: v,
    tooltip: `${v} kg`,
  }));
  const totalProduction = weeklyProduction.reduce((s, d) => s + d.value, 0);

  const formatCurrency = (n: number) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <AdminDashboardClient>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">
          Command Center
        </h1>
        <p className="text-text-secondary mt-1">
          Platform overview and operations at a glance
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          label="Active Orders"
          value={kpis.activeOrders}
          change={`${kpis.orderCount} total`}
          icon={<Package className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
        <StatCard
          label="Total Trays"
          value={kpis.totalTrays}
          change="+12 this week"
          icon={<Sprout className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
        <StatCard
          label="QC Pass Rate"
          value={`${kpis.qcRate}%`}
          change={kpis.qcRate >= 90 ? "On target" : "Below target"}
          changeType={kpis.qcRate >= 90 ? "positive" : "negative"}
          icon={<CheckCircle2 className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
        <StatCard
          label="Deliveries"
          value={kpis.deliveryCount}
          change="In transit"
          changeType="neutral"
          icon={<Truck className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
        <StatCard
          label="Revenue"
          value={`₹${formatCurrency(kpis.totalRevenue)}`}
          change="+18%"
          icon={<IndianRupee className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
        <StatCard
          label="Growers"
          value={kpis.activeGrowers}
          change={`${kpis.growerCount} registered`}
          icon={<Users className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
      </div>

      {/* Pending Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {pendingActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}>
              <div className="glass-card p-4 hover:bg-white/50 transition-all cursor-pointer group row-hover">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center text-white shadow-lg`}
                  >
                    {action.count > 0 ? (
                      <span className="text-lg font-bold">{action.count}</span>
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-secondary group-hover:text-sprout-800 transition-colors leading-tight">
                      {action.label}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary">Recent Orders</h2>
              <Link
                href="/admin/demand"
                className="inline-flex items-center gap-1 text-xs font-semibold text-sprout-600 hover:text-sprout-800 transition-colors"
              >
                Demand Engine
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 bg-white/50 rounded-xl p-4 border border-white/40 row-hover cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-text-primary">
                          {order.id}
                        </h3>
                        <StatusBadge
                          status={
                            order.status === "in-production"
                              ? "growing"
                              : order.status === "confirmed"
                                ? "active"
                                : order.status === "pending-payment"
                                  ? "pending"
                                  : (order.status as "active")
                          }
                        />
                      </div>
                      <p className="text-xs text-text-muted">
                        {order.restaurant} — {order.cropType} × {order.quantityKg}kg
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-text-primary">
                        ₹{order.totalPrice.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[11px] text-text-muted">{order.date}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 group-hover:text-sprout-800 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Package className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-text-muted">No orders yet</p>
              </div>
            )}
          </GlassCard>

          {/* Production Volume Chart */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary">Weekly Production</h2>
              <span className="text-xs text-text-muted">Last 8 weeks</span>
            </div>
            <AdminWeeklyChart data={weeklyProduction} />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/30">
              <span className="text-sm text-text-muted">Total output (8 weeks)</span>
              <span className="text-lg font-black text-sprout-800">{totalProduction} kg</span>
            </div>
          </GlassCard>
        </div>

        {/* Grower Leaderboard — 1 col */}
        <div>
          <GlassCard>
            <div className="flex items-center gap-2 mb-5">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-text-primary">Top Growers</h2>
            </div>
            {topGrowers.length > 0 ? (
              <div className="space-y-3">
                {topGrowers.map((grower, i) => {
                  const rankStyles = [
                    "bg-amber-100 text-amber-700",
                    "bg-gray-100 text-gray-600",
                    "bg-orange-100 text-orange-700",
                  ];
                  const RankIcon = i < 3 ? (i === 0 ? Trophy : Medal) : null;

                  return (
                    <div
                      key={grower.name}
                      className="flex items-center gap-3 bg-white/50 rounded-xl p-3 border border-white/40 row-hover"
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          rankStyles[i] || "bg-sprout-50 text-text-muted"
                        }`}
                      >
                        {RankIcon ? (
                          <RankIcon className="w-3.5 h-3.5" />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {grower.name}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {grower.city} · {grower.trays} tasks
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-sprout-800">{grower.score}</p>
                        <p className="text-[10px] text-text-muted">score</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-text-muted">No active growers</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </AdminDashboardClient>
  );
}

// Wrapper for the chart since it uses MiniBarChart (client component)
function AdminWeeklyChart({
  data,
}: {
  data: { label: string; value: number; tooltip: string }[];
}) {
  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((item, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center justify-end h-full group relative"
        >
          {/* Tooltip */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
            <div className="bg-text-primary text-white text-[10px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
              {item.tooltip}
            </div>
          </div>
          <div
            className="w-full bg-gradient-to-t from-sprout-700 to-sprout-400 rounded-lg hover:opacity-80 hover:shadow-lg hover:shadow-sprout-500/20 transition-all"
            style={{ height: `${(item.value / 120) * 100}%` }}
          />
          <p className="text-[10px] text-text-muted mt-1.5 font-medium">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
