import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { order } from "@/test/restaurant-fixtures";
import { findUntranslated } from "@/test/translation";

vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "user-1" } }) }));
const getRestaurantOrders = vi.fn();
vi.mock("@/lib/restaurant-data", () => ({ getRestaurantOrders: (...a: unknown[]) => getRestaurantOrders(...a) }));

import SubscriptionsPage from "@/app/(dashboard)/restaurant/subscriptions/page";

const load = (orders: unknown[]) => getRestaurantOrders.mockResolvedValue({ businessName: "x", orders });
const renderPage = async () => render(await SubscriptionsPage());

describe("restaurant subscriptions", () => {
  beforeEach(() => getRestaurantOrders.mockReset());

  it("never claims that repeat orders run on their own", async () => {
    load([order({ recurrence: "weekly" })]);
    await renderPage();
    expect(screen.getByText(/Repeat orders are not placed for you yet/)).toBeInTheDocument();
    expect(screen.queryByText(/automatic/i)).not.toBeInTheDocument();
  });

  it("lists the orders placed with a repeat preference, with the cadence", async () => {
    load([order({ recurrence: "weekly", cropType: "radish", quantityKg: 2, totalPrice: 640 }), order({ id: "cmother00000zzzzz", recurrence: "biweekly" }), order({ id: "cmplain00000zzzzz" })]);
    await renderPage();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Every 2 weeks")).toBeInTheDocument();
    expect(screen.getByText("2 kg · ₹640")).toBeInTheDocument();
  });

  it("leaves out cancelled orders", async () => {
    load([order({ recurrence: "weekly", status: "CANCELLED" })]);
    await renderPage();
    expect(screen.getByText("No repeat orders yet")).toBeInTheDocument();
  });

  it("offers Order again with the crop, quantity and cadence filled in", async () => {
    load([order({ recurrence: "biweekly", cropType: "mustard", quantityKg: 1.5 })]);
    await renderPage();
    const item = screen.getByRole("listitem");
    expect(within(item).getByRole("link", { name: "Order again" })).toHaveAttribute("href", "/restaurant/order/new?crop=mustard&kg=1.5&recurrence=biweekly");
    expect(within(item).getByRole("link", { name: "CMORDER0" })).toHaveAttribute("href", "/restaurant/orders/cmorder0001abcdef");
  });

  it("is no longer a dead end: the empty state starts a repeat order", async () => {
    load([]);
    await renderPage();
    expect(screen.getByRole("link", { name: "Set up a repeat order" })).toHaveAttribute("href", "/restaurant/order/new?recurrence=weekly");
  });

  it("has Kannada and Hindi for everything it says", async () => {
    load([order({ recurrence: "weekly" })]);
    const { container } = await renderPage();
    expect(findUntranslated(container)).toEqual([]);
  });
});
