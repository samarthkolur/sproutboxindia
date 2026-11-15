// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const restaurantFind = vi.fn();
const orderFind = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: { restaurant: { findUnique: (a: unknown) => restaurantFind(a) }, order: { findFirst: (a: unknown) => orderFind(a) } },
}));

import { getRestaurantOrder, getRestaurantOrders } from "./restaurant-data";

describe("restaurant reads", () => {
  beforeEach(() => {
    restaurantFind.mockReset().mockResolvedValue({ businessName: "x", orders: [] });
    orderFind.mockReset().mockResolvedValue(null);
  });

  it("reads every order of the signed-in user's restaurant, with no row limit", async () => {
    await getRestaurantOrders("user-1");
    const args = restaurantFind.mock.calls[0][0];
    expect(args.where).toEqual({ userId: "user-1" });
    expect(args.select.orders).not.toHaveProperty("take");
    expect(args.select.orders.orderBy).toEqual({ createdAt: "desc" });
  });

  it("looks one order up through the owner's account, so another restaurant's order is not found", async () => {
    await getRestaurantOrder("user-1", "order-9");
    expect(orderFind.mock.calls[0][0].where).toEqual({ id: "order-9", restaurant: { userId: "user-1" } });
  });

  it("asks for what the tracker, ring and feedback need", async () => {
    await getRestaurantOrder("user-1", "order-9");
    const include = orderFind.mock.calls[0][0].include;
    expect(Object.keys(include).sort()).toEqual(["delivery", "feedback", "productionPlan"]);
  });
});
