// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  notification: { count: vi.fn() },
  order: { count: vi.fn(), findFirst: vi.fn() },
  productionPlan: { count: vi.fn() },
  task: { count: vi.fn() },
  batch: { count: vi.fn() },
  payout: { count: vi.fn() },
  cluster: { findFirst: vi.fn() },
  restaurant: { findUnique: vi.fn() },
  grower: { findUnique: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { cropName } from "./tasks";
import { getShellData } from "./shell-data";

beforeEach(() => {
  vi.resetAllMocks();
  prismaMock.notification.count.mockResolvedValue(3);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("getShellData: admin", () => {
  function seedAdmin(qc: number) {
    prismaMock.order.count.mockResolvedValue(2);
    prismaMock.productionPlan.count.mockResolvedValue(1);
    prismaMock.task.count.mockResolvedValue(4);
    prismaMock.batch.count.mockResolvedValue(qc);
    prismaMock.payout.count.mockResolvedValue(6);
    prismaMock.cluster.findFirst.mockResolvedValue({ name: "Bengaluru North" });
  }

  it("maps each pipeline count to its sidebar badge and names the workspace", async () => {
    seedAdmin(5);
    const data = await getShellData("ADMIN", "u1");
    expect(data.workspace).toBe("Bengaluru North");
    expect(data.unread).toBe(3);
    expect(data.badges).toEqual({
      adminDemand: 2,
      adminAllocations: 1,
      adminDispatch: 4,
      adminQc: 5,
      adminPayouts: 6,
    });
  });

  it("pins the QC queue with a plural caption", async () => {
    seedAdmin(5);
    const { pinned } = await getShellData("ADMIN", "u1");
    expect(pinned).toMatchObject({ value: "5", caption: "batches to review", href: "/admin/qc" });
  });

  it("uses the singular caption for one batch", async () => {
    seedAdmin(1);
    expect((await getShellData("ADMIN", "u1")).pinned.caption).toBe("batch to review");
  });

  it("says all clear when nothing is waiting", async () => {
    seedAdmin(0);
    expect((await getShellData("ADMIN", "u1")).pinned).toMatchObject({
      value: "All clear",
      caption: "No batches waiting",
    });
  });

  it("falls back to 'Operations' when no cluster exists", async () => {
    seedAdmin(0);
    prismaMock.cluster.findFirst.mockResolvedValue(null);
    expect((await getShellData("ADMIN", "u1")).workspace).toBe("Operations");
  });
});

describe("getShellData: restaurant", () => {
  it("pins the soonest upcoming delivery and counts orders awaiting payment", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue({ id: "r1", businessName: "Green Bowl" });
    prismaMock.order.count.mockResolvedValue(2);
    prismaMock.order.findFirst.mockResolvedValue({
      id: "o9",
      cropType: "sunflower",
      quantityKg: 4,
      deliveryDate: new Date(2026, 10, 19),
    });

    const data = await getShellData("RESTAURANT", "u2");
    expect(data.workspace).toBe("Green Bowl");
    expect(data.badges).toEqual({ restaurantAwaitingPayment: 2 });
    expect(data.pinned).toEqual({
      label: "Next delivery",
      value: "Thu, 19 Nov",
      caption: `${cropName("sunflower")} · 4 kg`,
      href: "/restaurant/orders/o9",
    });
  });

  it("only looks at the restaurant's own, still-live orders", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue({ id: "r1", businessName: "Green Bowl" });
    prismaMock.order.count.mockResolvedValue(0);
    prismaMock.order.findFirst.mockResolvedValue(null);
    await getShellData("RESTAURANT", "u2");

    expect(prismaMock.order.count).toHaveBeenCalledWith({
      where: { restaurantId: "r1", status: "PENDING_PAYMENT" },
    });
    const where = prismaMock.order.findFirst.mock.calls[0][0].where;
    expect(where.restaurantId).toBe("r1");
    expect(where.status.in).not.toContain("DELIVERED");
    expect(where.status.in).not.toContain("CANCELLED");
  });

  it("invites an order when nothing is scheduled", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue({ id: "r1", businessName: "Green Bowl" });
    prismaMock.order.count.mockResolvedValue(0);
    prismaMock.order.findFirst.mockResolvedValue(null);
    expect((await getShellData("RESTAURANT", "u2")).pinned).toMatchObject({
      value: "None scheduled",
      href: "/restaurant/order/new",
    });
  });

  it("uses the generic restaurant fallback when the profile is missing", async () => {
    prismaMock.restaurant.findUnique.mockResolvedValue(null);
    const data = await getShellData("RESTAURANT", "u2");
    expect(data.workspace).toBe("Restaurant");
    expect(data.badges).toEqual({});
  });
});

describe("getShellData: grower", () => {
  const sunflower = (id: string, checkIns: { createdAt: Date }[] = []) => ({
    id,
    cropType: "sunflower",
    status: "IN_PROGRESS",
    trayCount: 3,
    sowDate: new Date(2026, 10, 10),
    harvestDate: new Date(2026, 10, 19),
    batches: [{ status: "GROWING", currentDay: 4, checkIns }],
  });

  it("pins the first task that can be checked in and counts every due one", async () => {
    prismaMock.grower.findUnique.mockResolvedValue({
      city: "Mysuru",
      tasks: [sunflower("t1", [{ createdAt: new Date() }]), sunflower("t2"), sunflower("t3")],
    });

    const data = await getShellData("GROWER", "u3");
    expect(data.workspace).toBe("Mysuru");
    expect(data.badges).toEqual({ growerCheckinsDue: 2 });
    expect(data.pinned).toEqual({
      label: "Next check-in",
      value: "Day 5",
      caption: `${cropName("sunflower")} · 3 trays`,
      href: "/grower/tasks/t2",
    });
  });

  it("says all checked in when nothing is due", async () => {
    prismaMock.grower.findUnique.mockResolvedValue({
      city: "Mysuru",
      tasks: [sunflower("t1", [{ createdAt: new Date() }])],
    });
    const data = await getShellData("GROWER", "u3");
    expect(data.badges).toEqual({ growerCheckinsDue: 0 });
    expect(data.pinned).toMatchObject({ value: "All checked in", href: "/grower/tasks" });
  });
});

describe("getShellData: failure", () => {
  it.each(["ADMIN", "RESTAURANT", "GROWER"] as const)("%s falls back instead of throwing", async (role) => {
    prismaMock.notification.count.mockRejectedValue(new Error("db down"));
    const data = await getShellData(role, "u1");
    expect(data.badges).toEqual({});
    expect(data.unread).toBe(0);
    expect(data.pinned.value).toBe("—");
  });

  it("falls back when a role query fails after the unread count succeeded", async () => {
    prismaMock.order.count.mockRejectedValue(new Error("timeout"));
    prismaMock.productionPlan.count.mockResolvedValue(0);
    prismaMock.task.count.mockResolvedValue(0);
    prismaMock.batch.count.mockResolvedValue(0);
    prismaMock.payout.count.mockResolvedValue(0);
    prismaMock.cluster.findFirst.mockResolvedValue(null);
    const data = await getShellData("ADMIN", "u1");
    expect(data.workspace).toBe("Operations");
    expect(data.unread).toBe(0);
  });
});
