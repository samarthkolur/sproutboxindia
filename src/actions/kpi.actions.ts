"use server";

import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface KpiSnapshot {
  kgDeliveredPerWeek: { value: number; target: number };
  qcPassRate: { value: number | null; target: number; sampleSize: number };
  onTimeDeliveryRate: { value: number | null; target: number; sampleSize: number };
  activeCertifiedGrowers: { value: number; target: number };
  growerAcceptanceRate: { value: null; target: number; note: string };
  mrr: { value: number; target: number };
  restaurantChurnRate: { value: number | null; target: number; cohortSize: number };
}

// Computes the seven KPIs from the assignment's measurement framework
// directly from live data. Three are honestly flagged rather than
// faked where the product doesn't yet track what the KPI needs:
// Grower Acceptance Rate (no accept/reject step exists), and QC Pass /
// On-Time Delivery return null with sampleSize 0 when there's no data
// yet, instead of a misleading 0% or 100%.
export async function getKpiSnapshot(): Promise<KpiSnapshot> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY_MS);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);

  const [
    deliveredLastWeek,
    reviewedCheckIns,
    deliveredDeliveries,
    activeGrowerCount,
    fulfilledOrdersLast30d,
    restaurantsWithOldOrder,
  ] = await Promise.all([
    prisma.delivery.findMany({
      where: { status: "DELIVERED", deliveredAt: { gte: sevenDaysAgo } },
      include: { order: { select: { quantityKg: true } } },
    }),
    prisma.checkIn.findMany({
      where: { qcResult: { not: null } },
      select: { qcResult: true },
    }),
    prisma.delivery.findMany({
      where: { status: "DELIVERED", deliveredAt: { not: null } },
      include: { order: { select: { deliveryDate: true } } },
    }),
    prisma.grower.count({ where: { isActive: true } }),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED] },
      },
    }),
    prisma.restaurant.findMany({
      where: { isActive: true, orders: { some: { createdAt: { lt: thirtyDaysAgo } } } },
      select: {
        id: true,
        orders: { where: { createdAt: { gte: thirtyDaysAgo } }, select: { id: true }, take: 1 },
      },
    }),
  ]);

  const kgDeliveredPerWeek = deliveredLastWeek.reduce((sum, d) => sum + d.order.quantityKg, 0);

  const qcPassCount = reviewedCheckIns.filter((c) => c.qcResult === "PASS").length;
  const qcPassRate = reviewedCheckIns.length > 0 ? qcPassCount / reviewedCheckIns.length : null;

  const onTimeCount = deliveredDeliveries.filter(
    (d) => d.deliveredAt && d.order.deliveryDate && d.deliveredAt <= d.order.deliveryDate
  ).length;
  const onTimeDeliveryRate = deliveredDeliveries.length > 0 ? onTimeCount / deliveredDeliveries.length : null;

  const churnedCount = restaurantsWithOldOrder.filter((r) => r.orders.length === 0).length;
  const restaurantChurnRate =
    restaurantsWithOldOrder.length > 0 ? churnedCount / restaurantsWithOldOrder.length : null;

  return {
    kgDeliveredPerWeek: { value: kgDeliveredPerWeek, target: 300 },
    qcPassRate: { value: qcPassRate, target: 0.95, sampleSize: reviewedCheckIns.length },
    onTimeDeliveryRate: { value: onTimeDeliveryRate, target: 0.95, sampleSize: deliveredDeliveries.length },
    activeCertifiedGrowers: { value: activeGrowerCount, target: 150 },
    growerAcceptanceRate: {
      value: null,
      target: 0.9,
      note: "Not trackable yet — the product has no accept/reject step for allocated tray tasks.",
    },
    mrr: { value: fulfilledOrdersLast30d._sum.totalPrice || 0, target: 540000 },
    restaurantChurnRate: { value: restaurantChurnRate, target: 0.03, cohortSize: restaurantsWithOldOrder.length },
  };
}
