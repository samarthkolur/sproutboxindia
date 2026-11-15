// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const orderFindFirst = vi.fn();
const orderFindUnique = vi.fn();
const taskFindFirst = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => auth() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findFirst: (a: unknown) => orderFindFirst(a), findUnique: (a: unknown) => orderFindUnique(a) },
    task: { findFirst: (a: unknown) => taskFindFirst(a) },
  },
}));

import { GET } from "@/app/api/invoices/[kind]/[id]/route";

const call = (kind: string, id = "x1") => GET(new Request("http://localhost/x"), { params: { kind, id } });
const as = (role: string, id = "user-1") => auth.mockResolvedValue({ user: { id, role } });

const created = new Date(2026, 9, 13);
const orderRow = {
  id: "cmabc12345xyz", cropType: "sunflower", quantityKg: 3, totalPrice: 1350, status: "DELIVERED", createdAt: created, deliveryDate: created,
  restaurant: { businessName: "The Green Bowl", contactName: "Arjun", address: "14 Road", city: "Bengaluru", pincode: "560095", phone: "9000000021", gstin: null },
  delivery: { deliveredAt: created },
};
const taskRow = (paid: boolean) => ({
  id: "cmtask0001zzz", cropType: "sunflower", trayCount: 1, sowDate: created, harvestDate: created, growerId: "g1",
  grower: { address: "112 Main", city: "Bengaluru", pincode: "560102", phone: "9000000002", upiId: "9000000002@ybl", user: { name: "Suresh Gowda" } },
  plan: { orderId: "cmabc12345xyz" },
  batches: [{ status: "HARVESTED", harvestedAt: created, payout: paid ? { amount: 50, status: "PAID", paidAt: created, createdAt: created } : null }],
});
const settlementRow = {
  ...orderRow,
  restaurant: { businessName: "The Green Bowl" },
  productionPlan: { tasks: [{ growerId: "g1", grower: { user: { name: "Suresh Gowda" } }, batches: [{ status: "HARVESTED", payout: { amount: 50, status: "PAID" } }, { status: "REJECTED", payout: null }] }] },
};

describe("GET /api/invoices/[kind]/[id]", () => {
  beforeEach(() => {
    auth.mockReset();
    orderFindFirst.mockReset().mockResolvedValue(orderRow);
    orderFindUnique.mockReset().mockResolvedValue(settlementRow);
    taskFindFirst.mockReset().mockResolvedValue(taskRow(true));
  });

  it("needs a signed-in user", async () => {
    auth.mockResolvedValue(null);
    expect((await call("restaurant")).status).toBe(401);
  });

  it("sends a restaurant its invoice as a PDF download", async () => {
    as("RESTAURANT");
    const res = await call("restaurant");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="SB-INV-20261013-CMABC123.pdf"');
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(Buffer.from(await res.arrayBuffer()).subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("looks a restaurant's order up through its own account only", async () => {
    as("RESTAURANT", "user-9");
    await call("restaurant", "order-1");
    expect(orderFindFirst.mock.calls[0][0].where).toEqual({ id: "order-1", restaurant: { userId: "user-9" } });
  });

  it("is a 404 for another restaurant's order, and gives a grower no restaurant invoice", async () => {
    as("RESTAURANT");
    orderFindFirst.mockResolvedValue(null);
    expect((await call("restaurant")).status).toBe(404);
    as("GROWER");
    expect((await call("restaurant")).status).toBe(404);
  });

  it("lets an admin read any order's invoice", async () => {
    as("ADMIN");
    await call("restaurant", "order-1");
    expect(orderFindFirst.mock.calls[0][0].where).toEqual({ id: "order-1" });
  });

  it("refuses an invoice for an order that has not been paid", async () => {
    as("RESTAURANT");
    orderFindFirst.mockResolvedValue({ ...orderRow, status: "PENDING_PAYMENT" });
    const res = await call("restaurant");
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("NOT_INVOICEABLE");
  });

  it("sends a grower their payout statement, scoped to their own tasks", async () => {
    as("GROWER", "user-3");
    const res = await call("grower", "task-1");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("SB-PAY-20261013-CMTASK00");
    expect(taskFindFirst.mock.calls[0][0].where).toEqual({ id: "task-1", grower: { userId: "user-3" } });
  });

  it("has no statement until the grower has a payout, and none for a restaurant", async () => {
    as("GROWER");
    taskFindFirst.mockResolvedValue(taskRow(false));
    expect((await call("grower")).status).toBe(409);
    as("RESTAURANT");
    expect((await call("grower")).status).toBe(404);
  });

  it("gives the settlement statement to an admin and to nobody else", async () => {
    as("ADMIN");
    const res = await call("platform");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("SB-SET-20261013-CMABC123");
    for (const role of ["RESTAURANT", "GROWER"]) {
      as(role);
      expect((await call("platform")).status).toBe(404);
    }
  });

  it("is a 404 for an unknown kind", async () => {
    as("ADMIN");
    expect((await call("receipt")).status).toBe(404);
  });
});
