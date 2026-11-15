// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// The vitest config restores mocks between tests, so every implementation is set in beforeEach.
const mocks = {
  orderCount: vi.fn(),
  orderAggregate: vi.fn(),
  batchCount: vi.fn(),
  growerCount: vi.fn(),
  deliveryCount: vi.fn(),
};
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { count: (a?: unknown) => mocks.orderCount(a), aggregate: (a?: unknown) => mocks.orderAggregate(a) },
    batch: { count: (a?: unknown) => mocks.batchCount(a) },
    grower: { count: (a?: unknown) => mocks.growerCount(a) },
    delivery: { count: (a?: unknown) => mocks.deliveryCount(a) },
  },
}));

import { getAdminKPIs } from "@/actions/dashboard.actions";

type Where = { where?: { status?: { in?: string[] } } } | undefined;
const statusesOf = (args: Where) => args?.where?.status?.in;

describe("getAdminKPIs QC pass rate", () => {
  beforeEach(() => {
    mocks.orderCount.mockResolvedValue(0);
    mocks.orderAggregate.mockResolvedValue({ _sum: { totalPrice: 0 } });
    mocks.growerCount.mockResolvedValue(0);
    mocks.deliveryCount.mockResolvedValue(0);
    // 37 trays passed (and were harvested), 5 were rejected.
    mocks.batchCount.mockImplementation(async (args: Where) => {
      const statuses = statusesOf(args);
      if (!statuses) return 42;
      return statuses.includes("REJECTED") ? 42 : 37;
    });
  });

  it("counts harvested trays as having passed, so a finished order does not read 0%", async () => {
    expect((await getAdminKPIs()).qcRate).toBe(88);
  });

  it("asks for harvested trays in both the passed and the reviewed totals", async () => {
    await getAdminKPIs();
    const queried = mocks.batchCount.mock.calls.map(([args]) => statusesOf(args)).filter((s): s is string[] => Boolean(s));
    expect(queried.length).toBeGreaterThanOrEqual(2);
    expect(queried.every((statuses) => statuses.includes("HARVESTED"))).toBe(true);
  });

  it("is 0 when nothing has been reviewed yet", async () => {
    mocks.batchCount.mockResolvedValue(0);
    expect((await getAdminKPIs()).qcRate).toBe(0);
  });
});
