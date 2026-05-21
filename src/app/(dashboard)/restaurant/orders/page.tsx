import { GlassCard } from "@/components/shared/GlassCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CROP_DISPLAY_NAMES, type CropType } from "@/lib/constants";
import { Package, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";

async function getOrders(userId: string) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { userId },
      include: {
        orders: { orderBy: { createdAt: "desc" } },
      },
    });
    return restaurant?.orders || [];
  } catch {
    return [];
  }
}

export default async function RestaurantOrdersPage() {
  const session = await auth();
  const userId = session?.user?.id || "";
  const orders = await getOrders(userId);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">My Orders</h1>
          <p className="text-text-secondary mt-1">View and track all your orders</p>
        </div>
        <Link
          href="/restaurant/order/new"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sprout-800 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-sprout-900 sm:w-auto"
        >
          New Order <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => {
            const statusMap: Record<string, "pending" | "active" | "growing" | "delivered" | "completed" | "cancelled"> = {
              PENDING_PAYMENT: "pending", CONFIRMED: "active", IN_PRODUCTION: "growing",
              AT_HUB: "active", IN_TRANSIT: "active", DELIVERED: "delivered", CANCELLED: "cancelled",
            };
            return (
              <GlassCard key={order.id} padding="sm">
                <Link
                  href={`/restaurant/orders/${order.id}`}
                  className="flex w-full flex-col gap-3 rounded-xl row-hover cursor-pointer group min-[520px]:flex-row min-[520px]:items-center min-[520px]:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text-primary">
                        {order.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <StatusBadge status={statusMap[order.status] || "active"} />
                    </div>
                    <p className="text-xs text-text-muted">
                      {CROP_DISPLAY_NAMES[order.cropType as CropType] || order.cropType} × {order.quantityKg}kg
                      · {order.createdAt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-text-primary min-[520px]:text-right">₹{order.totalPrice.toLocaleString("en-IN")}</p>
                  <ChevronRight className="hidden h-4 w-4 text-text-muted transition-all group-hover:text-sprout-800 min-[520px]:block" />
                </Link>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <GlassCard>
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">No orders yet</h3>
            <p className="text-sm text-text-muted mb-4">Place your first microgreen order</p>
            <Link href="/restaurant/order/new" className="btn-primary inline-flex items-center gap-2">
              Place Order <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
