// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { m } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    m: {
      orderCount: fn(), orderAggregate: fn(), orderFindMany: fn(), batchCount: fn(), taskCount: fn(), taskAggregate: fn(), planCount: fn(),
      payoutCount: fn(), growerCount: fn(), growerFindMany: fn(), deliveryCount: fn(), deliveryFindMany: fn(), notificationFindMany: fn(),
    },
  };
});
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { count: (a?: unknown) => m.orderCount(a), aggregate: (a?: unknown) => m.orderAggregate(a), findMany: (a?: unknown) => m.orderFindMany(a) },
    batch: { count: (a?: unknown) => m.batchCount(a) },
    task: { count: (a?: unknown) => m.taskCount(a), aggregate: (a?: unknown) => m.taskAggregate(a) },
    productionPlan: { count: (a?: unknown) => m.planCount(a) },
    payout: { count: (a?: unknown) => m.payoutCount(a) },
    grower: { count: (a?: unknown) => m.growerCount(a), findMany: (a?: unknown) => m.growerFindMany(a) },
    delivery: { count: (a?: unknown) => m.deliveryCount(a), findMany: (a?: unknown) => m.deliveryFindMany(a) },
    notification: { findMany: (a?: unknown) => m.notificationFindMany(a) },
  },
}));

import { getAdminOverview, getPipelineCounts } from "@/lib/admin-data";

type Where = { where?: { status?: { in?: string[] } | string } } | undefined;

beforeEach(() => {
  m.orderCount.mockResolvedValue(16);
  m.orderAggregate.mockResolvedValue({ _sum: { totalPrice: 10465 } });
  m.orderFindMany.mockResolvedValue([]);
  m.planCount.mockResolvedValue(3);
  m.taskCount.mockResolvedValue(2);
  m.taskAggregate.mockResolvedValue({ _sum: { trayCount: 41 } });
  m.payoutCount.mockResolvedValue(1);
  m.growerCount.mockResolvedValue(14);
  m.growerFindMany.mockResolvedValue([{ id: "g1", city: "Bengaluru", compositeScore: 0.98, user: { name: "Lakshmi" }, tasks: [{ trayCount: 8 }, { trayCount: 10 }] }]);
  m.deliveryCount.mockResolvedValue(0);
  m.deliveryFindMany.mockResolvedValue([]);
  m.notificationFindMany.mockResolvedValue([]);
  // 37 passed or harvested, 42 reviewed.
  m.batchCount.mockImplementation(async (args: Where) => {
    const status = args?.where?.status;
    if (status === "QC_PENDING") return 5;
    const list = typeof status === "object" ? status.in : undefined;
    return list?.includes("REJECTED") ? 42 : 37;
  });
});

describe("getPipelineCounts", () => {
  it("counts what is waiting at each step", async () => {
    expect(await getPipelineCounts()).toEqual({ demand: 16, allocate: 3, dispatch: 2, qc: 5, payout: 1 });
  });
});

describe("getAdminOverview", () => {
  it("counts a harvested tray as having passed QC, so a finished order does not read 0%", async () => {
    expect((await getAdminOverview("admin-1")).qcRate).toBe(88);
  });

  it("has no QC rate before anything is reviewed", async () => {
    m.batchCount.mockImplementation(async (args: Where) => (args?.where?.status === "QC_PENDING" ? 0 : 0));
    expect((await getAdminOverview("admin-1")).qcRate).toBeNull();
  });

  it("reports revenue from paid orders only and trays from live tasks", async () => {
    const data = await getAdminOverview("admin-1");
    expect(data.revenue).toBe(10465);
    expect(data.traysGrowing).toBe(41);
    const where = m.orderAggregate.mock.calls[0][0].where;
    expect(where.status.notIn).toEqual(["PENDING_PAYMENT", "CANCELLED"]);
  });

  it("gives every week for the chart and sums a grower's trays across tasks", async () => {
    const data = await getAdminOverview("admin-1");
    expect(data.weeks.orderedKg).toHaveLength(12);
    expect(data.weeks.deliveredKg).toHaveLength(12);
    expect(data.topGrowers[0]).toMatchObject({ name: "Lakshmi", trays: 18, score: 0.98 });
  });

  it("reads the activity feed for the signed-in admin only", async () => {
    await getAdminOverview("admin-7");
    expect(m.notificationFindMany.mock.calls[0][0].where).toEqual({ userId: "admin-7" });
  });
});
