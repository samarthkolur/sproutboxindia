// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const restaurantFind = vi.fn();
const orderFind = vi.fn();
const upsert = vi.fn();
const orderUpdate = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => auth() }));
vi.mock("@/lib/business", () => ({ updateGrowerScores: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    restaurant: { findUnique: (a: unknown) => restaurantFind(a) },
    order: { findFirst: (a: unknown) => orderFind(a), update: (a: unknown) => orderUpdate(a) },
    feedback: { upsert: (a: unknown) => upsert(a) },
  },
}));

import { PATCH } from "@/app/api/restaurant/feedback/route";

const send = (body: unknown) => PATCH(new Request("http://localhost/x", { method: "PATCH", body: JSON.stringify(body) }));

describe("PATCH /api/restaurant/feedback", () => {
  beforeEach(() => {
    auth.mockReset().mockResolvedValue({ user: { id: "user-1", role: "RESTAURANT" } });
    restaurantFind.mockReset().mockResolvedValue({ id: "rest-1" });
    orderFind.mockReset().mockResolvedValue({ id: "o1", status: "DELIVERED", productionPlan: { tasks: [{ growerId: "g1" }] } });
    upsert.mockReset().mockImplementation(async ({ create }) => ({ id: "f1", ...create }));
    orderUpdate.mockReset();
  });

  it("saves feedback for a delivered order of this restaurant", async () => {
    const res = await send({ orderId: "o1", rating: 4, notes: "Tags: Quality\nFresh" });
    expect(res.status).toBe(200);
    expect(orderFind.mock.calls[0][0].where).toEqual({ id: "o1", restaurantId: "rest-1" });
    expect(upsert.mock.calls[0][0].create).toMatchObject({ orderId: "o1", restaurantId: "rest-1", rating: 4 });
  });

  it("does not accept feedback for an order that has not been delivered", async () => {
    orderFind.mockResolvedValue({ id: "o1", status: "IN_PRODUCTION", productionPlan: null });
    const res = await send({ orderId: "o1", rating: 5 });
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("NOT_DELIVERED");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("never changes the order's status (it used to mark any order delivered)", async () => {
    await send({ orderId: "o1", rating: 5 });
    expect(orderUpdate).not.toHaveBeenCalled();
  });

  it("is a 404 for another restaurant's order", async () => {
    orderFind.mockResolvedValue(null);
    expect((await send({ orderId: "o1", rating: 5 })).status).toBe(404);
  });

  it("rejects a rating outside 1 to 5", async () => {
    expect((await send({ orderId: "o1", rating: 6 })).status).toBe(422);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("is for restaurants only", async () => {
    auth.mockResolvedValue({ user: { id: "u", role: "GROWER" } });
    expect((await send({ orderId: "o1", rating: 5 })).status).toBe(401);
  });

  it("lets a second submission update the first (one feedback per order)", async () => {
    await send({ orderId: "o1", rating: 3 });
    expect(upsert.mock.calls[0][0].where).toEqual({ orderId: "o1" });
  });
});
