"use server";

import { prisma } from "@/lib/prisma";

// ── Admin KPIs ────────────────────────────────────────────────────────────────
export async function getAdminKPIs() {
  try {
    const [
      orderCount,
      activeOrders,
      totalTrays,
      growerCount,
      activeGrowers,
      deliveryCount,
      qcPassedCount,
      qcTotalCount,
      revenue,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: { status: { in: ["CONFIRMED", "IN_PRODUCTION", "AT_HUB", "IN_TRANSIT"] } },
      }),
      prisma.batch.count(),
      prisma.grower.count(),
      prisma.grower.count({ where: { isActive: true } }),
      prisma.delivery.count({ where: { status: "IN_TRANSIT" } }),
      // A tray that passed QC keeps counting once it is harvested; only then does it leave QC_PASSED.
      prisma.batch.count({ where: { status: { in: ["QC_PASSED", "HARVESTED"] } } }),
      prisma.batch.count({ where: { status: { in: ["QC_PASSED", "HARVESTED", "QC_FAILED", "REJECTED"] } } }),
      prisma.order.aggregate({ _sum: { totalPrice: true } }),
    ]);

    const qcRate = qcTotalCount > 0 ? Math.round((qcPassedCount / qcTotalCount) * 100) : 0;
    const totalRevenue = revenue._sum.totalPrice || 0;

    return {
      orderCount,
      activeOrders,
      totalTrays,
      growerCount,
      activeGrowers,
      deliveryCount,
      qcRate,
      totalRevenue,
    };
  } catch {
    return {
      orderCount: 0,
      activeOrders: 0,
      totalTrays: 0,
      growerCount: 0,
      activeGrowers: 0,
      deliveryCount: 0,
      qcRate: 0,
      totalRevenue: 0,
    };
  }
}

// ── Admin Recent Orders ───────────────────────────────────────────────────────
export async function getAdminRecentOrders(limit = 5) {
  try {
    const orders = await prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        restaurant: { select: { businessName: true } },
      },
    });

    return orders.map((o) => ({
      id: o.id.slice(0, 8).toUpperCase(),
      restaurant: o.restaurant.businessName,
      cropType: o.cropType,
      quantityKg: o.quantityKg,
      status: o.status.toLowerCase().replace("_", "-"),
      totalPrice: o.totalPrice,
      date: o.createdAt.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    }));
  } catch {
    return [];
  }
}

// ── Admin Top Growers ─────────────────────────────────────────────────────────
export async function getTopGrowers(limit = 5) {
  try {
    const growers = await prisma.grower.findMany({
      take: limit,
      orderBy: { compositeScore: "desc" },
      where: { isActive: true },
      include: {
        user: { select: { name: true } },
        _count: { select: { tasks: true } },
      },
    });

    return growers.map((g) => ({
      name: g.user.name || "Unknown",
      score: Math.round(g.compositeScore * 100),
      trays: g._count.tasks,
      city: g.city,
    }));
  } catch {
    return [];
  }
}

// ── Pending Action Counts (Admin) ─────────────────────────────────────────────
export async function getAdminPendingCounts() {
  try {
    const [ordersNoPlan, allocatePending, dispatchPending, qcPending, inTransit] = await Promise.all([
      prisma.order.count({
        where: { status: "CONFIRMED", productionPlan: null },
      }),
      prisma.productionPlan.count({ where: { status: "DRAFT" } }),
      prisma.task.count({ where: { status: "ASSIGNED" } }),
      prisma.batch.count({ where: { status: "QC_PENDING" } }),
      prisma.delivery.count({ where: { status: "IN_TRANSIT" } }),
    ]);

    return { ordersNoPlan, allocatePending, dispatchPending, qcPending, inTransit };
  } catch {
    return { ordersNoPlan: 0, allocatePending: 0, dispatchPending: 0, qcPending: 0, inTransit: 0 };
  }
}
