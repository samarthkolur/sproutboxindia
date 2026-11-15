import { subWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import { isLate, qcPassPercent, weeklyTotals, type PipelineCounts } from "@/lib/admin";
import type { KpiSnapshot } from "@/lib/kpi";
import { OrderStatus } from "@prisma/client";

// Server-only reads for the admin portal. Like the grower and restaurant reads they do not
// swallow errors, so a failed query reaches the error page and its retry instead of looking
// like an empty platform. The pages themselves sit behind the admin middleware.

/** How many things are waiting at each step of the pipeline. */
export async function getPipelineCounts(): Promise<PipelineCounts> {
  const [demand, allocate, dispatch, qc, payout] = await Promise.all([
    prisma.order.count({ where: { status: "CONFIRMED", productionPlan: null } }),
    prisma.productionPlan.count({ where: { status: "DRAFT" } }),
    prisma.task.count({ where: { status: "ASSIGNED" } }),
    prisma.batch.count({ where: { status: "QC_PENDING" } }),
    prisma.payout.count({ where: { status: "PENDING" } }),
  ]);
  return { demand, allocate, dispatch, qc, payout };
}

export async function getAdminOverview(adminUserId: string, now: Date = new Date()) {
  const since = subWeeks(now, 12);
  const [
    pipeline,
    orderTotals,
    revenue,
    activeOrders,
    growing,
    growers,
    activeGrowers,
    qcPassed,
    qcReviewed,
    inTransit,
    ordered,
    delivered,
    recentOrders,
    topGrowers,
    activity,
  ] = await Promise.all([
    getPipelineCounts(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalPrice: true }, where: { status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] } } }),
    prisma.order.count({ where: { status: { in: ["CONFIRMED", "IN_PRODUCTION", "AT_HUB", "IN_TRANSIT"] } } }),
    prisma.task.aggregate({ _sum: { trayCount: true }, where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "HARVEST_READY"] } } }),
    prisma.grower.count(),
    prisma.grower.count({ where: { isActive: true } }),
    // A tray that passed QC keeps counting once it is harvested.
    prisma.batch.count({ where: { status: { in: ["QC_PASSED", "HARVESTED"] } } }),
    prisma.batch.count({ where: { status: { in: ["QC_PASSED", "HARVESTED", "QC_FAILED", "REJECTED"] } } }),
    prisma.delivery.count({ where: { status: "IN_TRANSIT" } }),
    prisma.order.findMany({ where: { createdAt: { gte: since }, status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] } }, select: { createdAt: true, quantityKg: true } }),
    prisma.delivery.findMany({ where: { status: "DELIVERED", deliveredAt: { gte: since } }, select: { deliveredAt: true, order: { select: { quantityKg: true } } } }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, cropType: true, quantityKg: true, totalPrice: true, status: true, createdAt: true, restaurant: { select: { id: true, businessName: true } } },
    }),
    prisma.grower.findMany({
      take: 5,
      where: { isActive: true },
      orderBy: { compositeScore: "desc" },
      select: { id: true, city: true, compositeScore: true, user: { select: { name: true } }, tasks: { select: { trayCount: true } } },
    }),
    prisma.notification.findMany({ where: { userId: adminUserId }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  return {
    pipeline,
    orderTotals,
    revenue: revenue._sum.totalPrice ?? 0,
    activeOrders,
    traysGrowing: growing._sum.trayCount ?? 0,
    growers,
    activeGrowers,
    qcRate: qcPassPercent(qcPassed, qcReviewed),
    qcReviewed,
    inTransit,
    weeks: {
      orderedKg: weeklyTotals(ordered.map((o) => ({ at: o.createdAt, value: o.quantityKg })), now, 12),
      deliveredKg: weeklyTotals(delivered.map((d) => ({ at: d.deliveredAt, value: d.order.quantityKg })), now, 12),
    },
    recentOrders,
    topGrowers: topGrowers.map((g) => ({ id: g.id, name: g.user.name ?? "Grower", city: g.city, score: g.compositeScore, trays: g.tasks.reduce((sum, t) => sum + t.trayCount, 0) })),
    activity,
  };
}

// ── Growers ─────────────────────────────────────────────────────────────────

export async function getAdminGrowers() {
  const growers = await prisma.grower.findMany({
    include: {
      user: { select: { name: true, email: true } },
      tasks: { where: { status: { in: ["ASSIGNED", "IN_PROGRESS", "HARVEST_READY"] } }, select: { trayCount: true } },
      _count: { select: { payouts: true } },
    },
    orderBy: { compositeScore: "desc" },
  });
  // Scored trays: the scores come from finished (harvested or rejected) trays only.
  const finished = await prisma.batch.groupBy({ by: ["taskId"], where: { status: { in: ["HARVESTED", "REJECTED"] } }, _count: true });
  const taskGrower = await prisma.task.findMany({ where: { id: { in: finished.map((f) => f.taskId) } }, select: { id: true, growerId: true } });
  const growerOfTask = new Map(taskGrower.map((t) => [t.id, t.growerId]));
  const scored = new Map<string, number>();
  for (const f of finished) {
    const growerId = growerOfTask.get(f.taskId);
    if (growerId) scored.set(growerId, (scored.get(growerId) ?? 0) + f._count);
  }
  return growers.map((g) => ({
    id: g.id,
    name: g.user.name ?? g.user.email,
    email: g.user.email,
    city: g.city,
    kitSize: g.kitSize,
    activeTrays: g.tasks.reduce((sum, t) => sum + t.trayCount, 0),
    compositeScore: g.compositeScore,
    scoredTrays: scored.get(g.id) ?? 0,
    fssaiRegNumber: g.fssaiRegNumber,
    fssaiVerifiedAt: g.fssaiVerifiedAt,
    isActive: g.isActive,
  }));
}

export async function getAdminGrower(growerId: string) {
  const grower = await prisma.grower.findUnique({
    where: { id: growerId },
    include: {
      user: { select: { name: true, email: true } },
      cluster: { select: { name: true } },
      tasks: { orderBy: { sowDate: "desc" }, include: { plan: { select: { orderId: true, order: { select: { restaurant: { select: { businessName: true } } } } } } } },
      payouts: { orderBy: { createdAt: "desc" }, include: { batch: { select: { trayNumber: true, task: { select: { id: true, cropType: true } } } } } },
    },
  });
  if (!grower) return null;
  const scoredTrays = await prisma.batch.count({ where: { task: { growerId }, status: { in: ["HARVESTED", "REJECTED"] } } });
  return { grower, scoredTrays };
}

// ── Restaurants ─────────────────────────────────────────────────────────────

/** One aggregate query per figure, instead of loading every order just to count them. */
export async function getAdminRestaurants() {
  const [restaurants, counts, paid] = await Promise.all([
    prisma.restaurant.findMany({ include: { user: { select: { email: true } } }, orderBy: { businessName: "asc" } }),
    prisma.order.groupBy({ by: ["restaurantId"], _count: true, _max: { createdAt: true } }),
    prisma.order.groupBy({ by: ["restaurantId"], _sum: { totalPrice: true }, where: { status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] } } }),
  ]);
  const countOf = new Map(counts.map((c) => [c.restaurantId, c]));
  const revenueOf = new Map(paid.map((p) => [p.restaurantId, p._sum.totalPrice ?? 0]));
  return restaurants.map((r) => ({
    id: r.id,
    name: r.businessName,
    email: r.user.email,
    city: r.city,
    contactName: r.contactName,
    phone: r.phone,
    isActive: r.isActive,
    orders: countOf.get(r.id)?._count ?? 0,
    revenue: revenueOf.get(r.id) ?? 0,
    lastOrderAt: countOf.get(r.id)?._max.createdAt ?? null,
  }));
}

export async function getAdminRestaurant(restaurantId: string) {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      user: { select: { email: true } },
      orders: { orderBy: { createdAt: "desc" }, include: { feedback: { select: { id: true, rating: true, notes: true, createdAt: true } } } },
    },
  });
}

// ── Hubs ────────────────────────────────────────────────────────────────────

export async function getAdminHubs() {
  const hubs = await prisma.hub.findMany({
    orderBy: { name: "asc" },
    include: {
      cluster: { select: { name: true, _count: { select: { growers: true } } } },
      deliveries: { where: { status: { notIn: ["DELIVERED", "FAILED"] } }, select: { id: true } },
    },
  });
  return hubs.map((h) => ({
    id: h.id,
    name: h.name,
    address: h.address,
    clusterName: h.cluster.name,
    growers: h.cluster._count.growers,
    upcoming: h.deliveries.length,
    dropoffStart: h.dropoffStart,
    dropoffEnd: h.dropoffEnd,
    isActive: h.isActive,
  }));
}

export async function getAdminHub(hubId: string) {
  return prisma.hub.findUnique({
    where: { id: hubId },
    include: {
      cluster: { select: { name: true, growers: { select: { id: true, city: true, isActive: true, user: { select: { name: true } } }, orderBy: { compositeScore: "desc" } } } },
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { order: { select: { id: true, cropType: true, quantityKg: true, deliveryDate: true, restaurant: { select: { businessName: true } } } } },
      },
    },
  });
}

// ── Deliveries ──────────────────────────────────────────────────────────────

export async function getAdminDeliveries(status: string, limit: number) {
  const [rows, counts] = await Promise.all([
    prisma.delivery.findMany({
      where: status === "all" ? {} : { status: status as "PREPARING" | "PACKED" | "IN_TRANSIT" | "DELIVERED" | "FAILED" },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      include: { hub: { select: { name: true } }, order: { select: { id: true, cropType: true, quantityKg: true, deliveryDate: true, restaurant: { select: { businessName: true } } } } },
    }),
    prisma.delivery.groupBy({ by: ["status"], _count: true }),
  ]);
  return {
    deliveries: rows.slice(0, limit),
    hasMore: rows.length > limit,
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>,
  };
}

// ── Payouts ─────────────────────────────────────────────────────────────────

const STATUSES_OF = { pending: ["PENDING", "PROCESSING"], paid: ["PAID"], failed: ["FAILED"] } as const;

export async function getAdminPayouts(filter: "pending" | "paid" | "failed", query: string) {
  const search = query.trim();
  const where = {
    status: { in: [...STATUSES_OF[filter]] },
    ...(search ? { grower: { user: { name: { contains: search, mode: "insensitive" as const } } } } : {}),
  };
  const [rows, byStatus] = await Promise.all([
    prisma.payout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { grower: { select: { id: true, user: { select: { name: true } } } }, batch: { select: { trayNumber: true, task: { select: { cropType: true } } } } },
    }),
    // Totals over every payout, not the rows on the page.
    prisma.payout.groupBy({ by: ["status"], _sum: { amount: true }, _count: true }),
  ]);
  const sum = (statuses: readonly string[], key: "amount" | "count") =>
    byStatus.filter((s) => statuses.includes(s.status)).reduce((total, s) => total + (key === "amount" ? s._sum.amount ?? 0 : s._count), 0);
  return {
    rows: rows.map((p) => ({
      id: p.id,
      growerId: p.grower.id,
      growerName: p.grower.user.name ?? "Grower",
      cropType: p.batch.task.cropType,
      trayNumber: p.batch.trayNumber,
      createdAt: p.createdAt.toISOString(),
      status: p.status,
      amount: p.amount,
    })),
    totals: {
      pendingAmount: sum(STATUSES_OF.pending, "amount"),
      paidAmount: sum(STATUSES_OF.paid, "amount"),
      failedAmount: sum(STATUSES_OF.failed, "amount"),
      pendingCount: sum(STATUSES_OF.pending, "count"),
      paidCount: sum(STATUSES_OF.paid, "count"),
      failedCount: sum(STATUSES_OF.failed, "count"),
    },
  };
}

/** Delivered orders with where their money went, for the documents on each side of it. */
export async function getAdminSettlements() {
  const orders = await prisma.order.findMany({
    where: { status: "DELIVERED", productionPlan: { isNot: null } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      restaurant: { select: { businessName: true } },
      productionPlan: {
        include: {
          tasks: {
            include: {
              grower: { include: { user: { select: { name: true } } } },
              batches: { select: { payout: { select: { amount: true } } } },
            },
          },
        },
      },
    },
  });
  return orders.map((order) => {
    const growers = (order.productionPlan?.tasks ?? []).map((task) => ({
      taskId: task.id,
      name: task.grower.user.name ?? "Grower",
      amount: task.batches.reduce((sum, b) => sum + (b.payout?.amount ?? 0), 0),
    }));
    const paidOut = growers.reduce((sum, g) => sum + g.amount, 0);
    return { order, growers, paidOut, share: order.totalPrice - paidOut };
  });
}

// ── KPI scorecard ───────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

// The seven KPIs, computed from live data. Two are honestly flagged rather than faked where the
// product does not yet track what the KPI needs: grower acceptance (there is no accept/reject
// step) and, until there is data, QC pass and on-time delivery, which come back null rather
// than a misleading 0% or 100%.
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

  const eightWeeks = await prisma.delivery.findMany({
    where: { status: "DELIVERED", deliveredAt: { gte: new Date(now.getTime() - 56 * DAY_MS) } },
    select: { deliveredAt: true, order: { select: { quantityKg: true } } },
  });
  const weeklyKg = weeklyTotals(eightWeeks.map((d) => ({ at: d.deliveredAt, value: d.order.quantityKg })), now, 8).map((w) => w.value);
  const kgDeliveredPerWeek = deliveredLastWeek.reduce((sum, d) => sum + d.order.quantityKg, 0);

  const qcPassCount = reviewedCheckIns.filter((c) => c.qcResult === "PASS").length;
  const qcPassRate = reviewedCheckIns.length > 0 ? qcPassCount / reviewedCheckIns.length : null;

  const onTimeCount = deliveredDeliveries.filter((d) => d.deliveredAt && !isLate({ status: "DELIVERED", deliveredAt: d.deliveredAt }, d.order.deliveryDate)).length;
  const onTimeDeliveryRate = deliveredDeliveries.length > 0 ? onTimeCount / deliveredDeliveries.length : null;

  const churnedCount = restaurantsWithOldOrder.filter((r) => r.orders.length === 0).length;
  const restaurantChurnRate =
    restaurantsWithOldOrder.length > 0 ? churnedCount / restaurantsWithOldOrder.length : null;

  return {
    kgDeliveredPerWeek: { value: kgDeliveredPerWeek, weeks: weeklyKg },
    qcPassRate: { value: qcPassRate, sampleSize: reviewedCheckIns.length },
    onTimeDeliveryRate: { value: onTimeDeliveryRate, sampleSize: deliveredDeliveries.length },
    activeCertifiedGrowers: { value: activeGrowerCount },
    growerAcceptanceRate: {
      value: null,
      note: "Not trackable yet. The product has no accept or reject step for allocated tray tasks.",
    },
    mrr: { value: fulfilledOrdersLast30d._sum.totalPrice || 0 },
    restaurantChurnRate: { value: restaurantChurnRate, cohortSize: restaurantsWithOldOrder.length },
  };
}

// ── Analytics ───────────────────────────────────────────────────────────────

export async function getAdminAnalytics(now: Date = new Date()) {
  const since = subWeeks(now, 12);
  const paidWhere = { status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] as OrderStatus[] } };
  const [orders, payouts, deliveries, byCrop, restaurantTotals, qcCounts, growers, ratings] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: since }, ...paidWhere }, select: { createdAt: true, totalPrice: true, quantityKg: true } }),
    prisma.payout.findMany({ where: { status: "PAID", paidAt: { gte: since } }, select: { paidAt: true, amount: true } }),
    prisma.delivery.findMany({ where: { status: "DELIVERED", deliveredAt: { gte: since } }, select: { deliveredAt: true, order: { select: { quantityKg: true } } } }),
    prisma.order.groupBy({ by: ["cropType"], _sum: { totalPrice: true, quantityKg: true }, _count: true, where: paidWhere }),
    prisma.order.groupBy({ by: ["restaurantId"], _sum: { totalPrice: true }, _count: true, where: paidWhere, orderBy: { _sum: { totalPrice: "desc" } }, take: 5 }),
    prisma.checkIn.groupBy({ by: ["qcResult"], _count: true, where: { qcResult: { not: null } } }),
    prisma.grower.findMany({ where: { isActive: true }, select: { id: true, qualityScore: true, user: { select: { name: true } }, tasks: { select: { batches: { where: { status: { in: ["HARVESTED", "REJECTED"] } }, select: { id: true } } } } } }),
    prisma.feedback.aggregate({ _avg: { rating: true }, _count: true }),
  ]);
  const names = await prisma.restaurant.findMany({ where: { id: { in: restaurantTotals.map((r) => r.restaurantId) } }, select: { id: true, businessName: true } });
  const nameOf = new Map(names.map((n) => [n.id, n.businessName]));
  const revenue = weeklyTotals(orders.map((o) => ({ at: o.createdAt, value: o.totalPrice })), now, 12);
  const paidOut = weeklyTotals(payouts.map((p) => ({ at: p.paidAt, value: p.amount })), now, 12);

  return {
    revenue,
    payouts: paidOut,
    orders: weeklyTotals(orders.map((o) => ({ at: o.createdAt, value: 1 })), now, 12),
    orderedKg: weeklyTotals(orders.map((o) => ({ at: o.createdAt, value: o.quantityKg })), now, 12),
    deliveredKg: weeklyTotals(deliveries.map((d) => ({ at: d.deliveredAt, value: d.order.quantityKg })), now, 12),
    crops: byCrop.map((c) => ({ cropType: c.cropType, revenue: c._sum.totalPrice ?? 0, kg: c._sum.quantityKg ?? 0, orders: c._count })).sort((a, b) => b.revenue - a.revenue),
    topRestaurants: restaurantTotals.map((r) => ({ id: r.restaurantId, name: nameOf.get(r.restaurantId) ?? "Restaurant", revenue: r._sum.totalPrice ?? 0, orders: r._count })),
    qc: Object.fromEntries(qcCounts.map((q) => [q.qcResult ?? "NONE", q._count])) as Record<string, number>,
    growerQuality: growers
      .map((g) => ({ id: g.id, name: g.user.name ?? "Grower", quality: g.qualityScore, finished: g.tasks.reduce((sum, t) => sum + t.batches.length, 0) }))
      .filter((g) => g.finished > 0)
      .sort((a, b) => b.quality - a.quality),
    rating: ratings._avg.rating,
    ratingCount: ratings._count,
  };
}
