import { StatCard } from "@/components/shared/StatCard";
import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RestaurantDashboardClient } from "./client";
import { auth } from "@/lib/auth";
import { getRestaurantDashboard } from "@/actions/dashboard.actions";
import Link from "next/link";
import {
  Package,
  IndianRupee,
  ShoppingBag,
  Star,
  Plus,
  ChevronRight,
  Leaf,
  ArrowRight,
} from "lucide-react";
import {
  CROP_TYPES,
  CROP_DISPLAY_NAMES,
  CROP_PRICE_PER_KG,
  type CropType,
} from "@/lib/constants";

// Lucide icon map for crop types
const cropIcons: Record<string, React.ReactNode> = {
  sunflower: <Leaf className="w-5 h-5 text-amber-600" />,
  "pea-shoots": <Leaf className="w-5 h-5 text-green-600" />,
  radish: <Leaf className="w-5 h-5 text-red-500" />,
  wheatgrass: <Leaf className="w-5 h-5 text-lime-600" />,
  mustard: <Leaf className="w-5 h-5 text-yellow-600" />,
  fenugreek: <Leaf className="w-5 h-5 text-emerald-600" />,
};

export default async function RestaurantDashboard() {
  const session = await auth();
  const userId = session?.user?.id || "";
  const data = await getRestaurantDashboard(userId);

  // Build catalog from constants
  const catalog = CROP_TYPES.map((crop) => ({
    id: crop,
    name: CROP_DISPLAY_NAMES[crop],
    price: CROP_PRICE_PER_KG[crop],
    icon: cropIcons[crop] || <Leaf className="w-5 h-5 text-sprout-600" />,
    available: true, // All crops available by default
  }));

  return (
    <RestaurantDashboardClient>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">
            Welcome back
          </h1>
          <p className="text-text-secondary mt-1">
            Manage your microgreen orders and deliveries
          </p>
        </div>
        <Link
          href="/restaurant/order/new"
          className="inline-flex items-center gap-2 bg-sprout-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sprout-900 transition-all hover:shadow-lg hover:shadow-sprout-800/20 active:scale-[0.98]"
        >
          New Order
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Orders"
          value={data.activeOrders}
          change={data.activeOrders > 0 ? "In progress" : "None"}
          changeType={data.activeOrders > 0 ? "positive" : "neutral"}
          icon={<Package className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
        <StatCard
          label="This Month"
          value={`₹${data.monthSpend.toLocaleString("en-IN")}`}
          change="+12%"
          icon={<IndianRupee className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
        <StatCard
          label="Total Orders"
          value={data.totalOrders}
          change={`${data.totalOrders > 0 ? data.totalOrders : "No"} placed`}
          changeType="neutral"
          icon={<ShoppingBag className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
        <StatCard
          label="Avg. Rating"
          value={data.avgRating > 0 ? data.avgRating.toFixed(1) : "--"}
          change={data.avgRating >= 4.5 ? "Excellent" : data.avgRating > 0 ? "Good" : "No reviews"}
          changeType={data.avgRating >= 4.5 ? "positive" : "neutral"}
          icon={<Star className="w-[18px] h-[18px] text-sprout-700" strokeWidth={2} />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders — 2 cols */}
        <div className="lg:col-span-2">
          <GlassCard>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text-primary">Recent Orders</h2>
              <Link
                href="/restaurant/orders"
                className="inline-flex items-center gap-1 text-xs font-semibold text-sprout-600 hover:text-sprout-800 transition-colors"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {data.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {data.recentOrders.map((order) => (
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
                                  : order.status === "delivered"
                                    ? "delivered"
                                    : (order.status as "active")
                          }
                        />
                      </div>
                      <p className="text-xs text-text-muted">
                        {CROP_DISPLAY_NAMES[order.cropType as CropType] || order.cropType} × {order.quantityKg}kg
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-text-primary">
                        ₹{order.totalPrice.toLocaleString("en-IN")}
                      </p>
                      <p className="text-[11px] text-text-muted">{order.date}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 group-hover:text-sprout-800 group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <ShoppingBag className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-text-muted">No orders yet</p>
                <p className="text-xs text-text-muted mt-1">
                  Place your first order from the catalog
                </p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Crop Catalog — 1 col */}
        <div>
          <GlassCard>
            <h2 className="text-lg font-bold text-text-primary mb-4">Crop Catalog</h2>
            <div className="space-y-2">
              {catalog.map((crop) => (
                <div
                  key={crop.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    crop.available
                      ? "bg-white/50 border-white/40 hover:bg-white/70 hover:shadow-sm cursor-pointer group row-hover"
                      : "bg-gray-50/50 border-gray-100 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-sprout-50 flex items-center justify-center flex-shrink-0">
                    {crop.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {crop.name}
                    </p>
                    {!crop.available && (
                      <p className="text-[10px] text-text-muted">Out of stock</p>
                    )}
                  </div>
                  <span className="text-xs font-bold text-sprout-800">
                    ₹{crop.price}/kg
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/restaurant/order/new"
              className="flex items-center justify-center gap-2 w-full bg-sprout-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-sprout-900 transition-all mt-4 active:scale-[0.98] hover:shadow-lg hover:shadow-sprout-800/20"
            >
              Place Order
              <ArrowRight className="w-4 h-4" />
            </Link>
          </GlassCard>
        </div>
      </div>
    </RestaurantDashboardClient>
  );
}
