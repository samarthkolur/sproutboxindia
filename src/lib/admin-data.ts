import { subWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import { qcPassPercent, weeklyTotals, type PipelineCounts } from "@/lib/admin";

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
