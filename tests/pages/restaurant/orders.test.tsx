import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { daysFromNow, delivered, feedback, order } from "@/test/restaurant-fixtures";
import { findUntranslated } from "@/test/translation";

vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "user-1" } }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/restaurant/orders",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const getRestaurantOrders = vi.fn();
vi.mock("@/lib/restaurant-data", () => ({ getRestaurantOrders: (...a: unknown[]) => getRestaurantOrders(...a) }));

import RestaurantOrdersPage from "@/app/(dashboard)/restaurant/orders/page";

const awaiting = order({ id: "cmawaiting001abcd", status: "PENDING_PAYMENT", cropType: "radish", quantityKg: 2, totalPrice: 640, createdAt: daysFromNow(-1) });
const growing = order({ id: "cmgrowing0001abcd", createdAt: daysFromNow(-6) });
const done = delivered({ id: "cmdone000001abcde", cropType: "mustard", totalPrice: 1750, quantityKg: 5 });
const rated = delivered({ id: "cmrated00001abcde", cropType: "pea-shoots", totalPrice: 1330, quantityKg: 3.5, feedback: feedback() });
const cancelled = order({ id: "cmcancel00001abcd", status: "CANCELLED" });

const load = (orders: unknown[]) => getRestaurantOrders.mockResolvedValue({ businessName: "x", orders });
const renderPage = async (searchParams: Record<string, string> = {}) => render(await RestaurantOrdersPage({ searchParams }));
const table = () => screen.getByRole("table", { name: "Orders" });

describe("restaurant orders", () => {
  beforeEach(() => getRestaurantOrders.mockReset());

  it("reads only this user's orders", async () => {
    load([growing]);
    await renderPage();
    expect(getRestaurantOrders).toHaveBeenCalledWith("user-1");
  });

  it("counts each status on its chip", async () => {
    load([awaiting, growing, done, cancelled]);
    await renderPage();
    const chips = screen.getByRole("group", { name: "Filter orders" });
    const count = (name: RegExp) => within(chips).getByRole("link", { name });
    expect(count(/^All/)).toHaveTextContent("4");
    expect(count(/Awaiting payment/)).toHaveTextContent("1");
    expect(count(/In production/)).toHaveTextContent("1");
    expect(count(/Delivered/)).toHaveTextContent("1");
    expect(count(/Cancelled/)).toHaveTextContent("1");
  });

  it("filters by status from the URL", async () => {
    load([awaiting, growing, done]);
    await renderPage({ status: "delivered" });
    expect(within(table()).getByText("Mustard")).toBeInTheDocument();
    expect(within(table()).queryByText("Radish")).not.toBeInTheDocument();
  });

  it("searches by crop name or order reference", async () => {
    load([awaiting, growing, done]);
    const first = await renderPage({ q: "radish" });
    expect(within(table()).getAllByRole("row")).toHaveLength(2); // header + one
    first.unmount();
    await renderPage({ q: "CMDONE00" });
    expect(within(table()).getByText("Mustard")).toBeInTheDocument();
  });

  it("sorts by amount when asked", async () => {
    load([awaiting, done, rated]);
    await renderPage({ sort: "amount" });
    const rows = within(table()).getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("Mustard");
    expect(rows[2]).toHaveTextContent("Radish");
  });

  it("offers Pay now on an unpaid order, and no invoice for it yet", async () => {
    load([awaiting]);
    await renderPage();
    const row = within(table()).getAllByRole("row")[1];
    expect(within(row).getByRole("button", { name: "Pay now" })).toBeInTheDocument();
    expect(within(row).queryByRole("link", { name: /Download invoice/ })).not.toBeInTheDocument();
  });

  it("offers Rate on a delivered order without feedback, and shows the rating once given", async () => {
    load([done, rated]);
    await renderPage();
    expect(within(table()).getByRole("link", { name: "Rate order CMDONE00" })).toHaveAttribute("href", "/restaurant/feedback/cmdone000001abcde");
    expect(within(table()).getByText("Rated 4 of 5")).toBeInTheDocument();
    expect(within(table()).queryByRole("link", { name: "Rate order CMRATED0" })).not.toBeInTheDocument();
  });

  it("offers a downloadable invoice for paid orders only", async () => {
    load([awaiting, growing, cancelled, done]);
    await renderPage();
    const invoices = within(table()).getAllByRole("link", { name: /Download invoice/ });
    expect(invoices.map((a) => a.getAttribute("href"))).toEqual(["/api/invoices/restaurant/cmgrowing0001abcd", "/api/invoices/restaurant/cmdone000001abcde"]);
  });

  it("links each row to its order", async () => {
    load([growing]);
    await renderPage();
    expect(within(table()).getByRole("link", { name: "Sunflower Shoots, order CMGROWIN" })).toHaveAttribute("href", "/restaurant/orders/cmgrowing0001abcd");
  });

  it("explains an empty filter and offers to clear it", async () => {
    load([growing]);
    await renderPage({ status: "cancelled" });
    expect(screen.getByText("No orders match")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/restaurant/orders");
  });

  it("has a first-run empty state", async () => {
    load([]);
    await renderPage();
    expect(screen.getByText("No orders yet")).toBeInTheDocument();
  });

  it("says how many orders are waiting for payment", async () => {
    load([awaiting]);
    await renderPage();
    expect(screen.getByText("1 order is waiting for payment.")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", async () => {
    load([awaiting, growing, done, rated, cancelled]);
    const { container } = await renderPage();
    expect(findUntranslated(container)).toEqual([]);
  });
});
