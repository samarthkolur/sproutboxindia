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
      prisma.batch.count({ where: { status: "QC_PASSED" } }),
      prisma.batch.count({ where: { status: { in: ["QC_PASSED", "QC_FAILED", "REJECTED"] } } }),
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

// ── Grower Dashboard ──────────────────────────────────────────────────────────
export async function getGrowerDashboard(userId: string) {
  try {
    const grower = await prisma.grower.findUnique({
      where: { userId },
      include: {
        tasks: {
          where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "HARVEST_READY"] } },
          include: {
            batches: true,
          },
          orderBy: { sowDate: "asc" },
          take: 5,
        },
        payouts: {
          where: { status: "PAID" },
          orderBy: { paidAt: "desc" },
          take: 7,
        },
      },
    });

    if (!grower) {
      return {
        activeTrays: 0,
        tasksDue: 0,
        totalEarnings: 0,
        qcScore: 0,
        tasks: [],
        weeklyEarnings: [],
      };
    }

    const activeTraysAgg = await prisma.task.aggregate({
      where: { growerId: grower.id, status: { in: ["ASSIGNED", "IN_PROGRESS", "HARVEST_READY"] } },
      _sum: { trayCount: true },
    });
    const activeTrays = activeTraysAgg._sum.trayCount || 0;
    const tasksDue = await prisma.task.count({
      where: { growerId: grower.id, status: "ASSIGNED" },
    });

    return {
      activeTrays,
      tasksDue,
      totalEarnings: grower.totalEarnings,
      qcScore: Math.round(grower.qualityScore * 100),
      tasks: grower.tasks.map((t) => {
        const currentDay = t.batches.length > 0 ? Math.max(...t.batches.map((b) => b.currentDay)) : 0;
        const totalDays = Math.ceil(
          (t.harvestDate.getTime() - t.sowDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          id: t.id,
          cropType: t.cropType,
          trayCount: t.trayCount,
          currentDay,
          totalDays: totalDays || 7,
          status: t.status.toLowerCase().replace("_", "-"),
        };
      }),
      weeklyEarnings: grower.payouts.map((p) => ({
        amount: p.amount,
        label: p.paidAt
          ? p.paidAt.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
          : "N/A",
      })),
    };
  } catch {
    return {
      activeTrays: 0,
      tasksDue: 0,
      totalEarnings: 0,
      qcScore: 0,
      tasks: [],
      weeklyEarnings: [],
    };
  }
}

// ── Restaurant Dashboard ──────────────────────────────────────────────────────
export async function getRestaurantDashboard(userId: string) {
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { userId },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            productionPlan: {
              include: {
                tasks: {
                  include: { batches: true },
                },
              },
            },
          },
        },
        feedbacks: {
          select: { rating: true },
        },
      },
    });

    if (!restaurant) {
      return {
        activeOrders: 0,
        monthSpend: 0,
        totalOrders: 0,
        avgRating: 0,
        recentOrders: [],
      };
    }

    const activeOrders = restaurant.orders.filter((o) =>
      ["CONFIRMED", "IN_PRODUCTION", "AT_HUB", "IN_TRANSIT"].includes(o.status)
    ).length;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthSpend = restaurant.orders
      .filter((o) => o.createdAt >= monthStart)
      .reduce((s, o) => s + o.totalPrice, 0);

    const avgRating =
      restaurant.feedbacks.length > 0
        ? Math.round(
            (restaurant.feedbacks.reduce((s, f) => s + f.rating, 0) / restaurant.feedbacks.length) *
              10
          ) / 10
        : 0;

    return {
      activeOrders,
      monthSpend,
      totalOrders: restaurant.orders.length,
      avgRating,
      recentOrders: restaurant.orders.slice(0, 5).map((o) => {
        let progress = 0;
        let daysPassed = 0;
        let totalDays = 7;
        
        if (["DELIVERED"].includes(o.status)) {
          progress = 100;
        } else if (["AT_HUB", "IN_TRANSIT"].includes(o.status)) {
          progress = 90;
        } else if (o.status === "IN_PRODUCTION" && o.productionPlan) {
          totalDays = Math.max(
            7,
            Math.ceil(
              (o.productionPlan.harvestDate.getTime() - o.productionPlan.sowDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          );
          
          let maxDay = 0;
          for (const task of o.productionPlan.tasks) {
            for (const batch of task.batches) {
              if (batch.currentDay > maxDay) maxDay = batch.currentDay;
            }
          }
          daysPassed = maxDay;
          progress = Math.min(85, Math.round((maxDay / totalDays) * 100));
        }

        return {
          id: o.id.slice(0, 8).toUpperCase(),
          cropType: o.cropType,
          quantityKg: o.quantityKg,
          totalPrice: o.totalPrice,
          status: o.status.toLowerCase().replace(/_/g, "-"),
          date: o.createdAt.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
          progress,
          daysPassed,
          totalDays,
        };
      }),
    };
  } catch {
    return {
      activeOrders: 0,
      monthSpend: 0,
      totalOrders: 0,
      avgRating: 0,
      recentOrders: [],
    };
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
