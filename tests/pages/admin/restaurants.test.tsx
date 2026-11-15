import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

const { getAdminRestaurants, getAdminRestaurant } = vi.hoisted(() => ({ getAdminRestaurants: vi.fn(), getAdminRestaurant: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/admin/restaurants",
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/lib/admin-data", () => ({ getAdminRestaurants: (...a: unknown[]) => getAdminRestaurants(...a), getAdminRestaurant: (...a: unknown[]) => getAdminRestaurant(...a) }));

import AdminRestaurantsPage from "@/app/(dashboard)/admin/restaurants/page";
import AdminRestaurantDetailPage from "@/app/(dashboard)/admin/restaurants/[restaurantId]/page";

const day = 86400000;
const ago = (d: number) => new Date(Date.now() - d * day);
const restaurant = (id: string, name: string, over: Record<string, unknown> = {}) => ({
  id, name, email: `${id}@example.com`, city: "Bengaluru", contactName: "Arjun Mehta", phone: "9000000021", isActive: true, orders: 2, revenue: 2680, lastOrderAt: ago(5), ...over,
});
const list = [
  restaurant("r1", "The Green Bowl"),
  restaurant("r2", "Udupi Garden", { orders: 3, revenue: 900, lastOrderAt: ago(80) }),
  restaurant("r3", "Fresh Fare Kitchen", { orders: 0, revenue: 0, lastOrderAt: null }),
];
const renderList = async (searchParams: Record<string, string> = {}) => render(await AdminRestaurantsPage({ searchParams }));
const table = () => screen.getByRole("table", { name: "Restaurants" });

describe("admin restaurants list", () => {
  beforeEach(() => getAdminRestaurants.mockReset().mockResolvedValue(list));

  it("splits restaurants into active, dormant (no order in 30 days) and never ordered, with counts", async () => {
    await renderList();
    const chips = screen.getByRole("group", { name: "Filter restaurants" });
    const count = (n: RegExp) => within(chips).getByRole("link", { name: n });
    expect(count(/^All/)).toHaveTextContent("3");
    expect(count(/^Active/)).toHaveTextContent("1");
    expect(count(/Dormant/)).toHaveTextContent("1");
    expect(count(/Never ordered/)).toHaveTextContent("1");
    expect(screen.getByText("1 dormant and 1 never ordered. Open one to see its history.")).toBeInTheDocument();
  });

  it("filters to the dormant ones", async () => {
    await renderList({ status: "dormant" });
    expect(within(table()).getByText("Udupi Garden")).toBeInTheDocument();
    expect(within(table()).queryByText("The Green Bowl")).not.toBeInTheDocument();
  });

  it("shows orders, revenue and the last order, and links each row to the restaurant", async () => {
    await renderList();
    const row = within(table()).getByRole("link", { name: "Udupi Garden" });
    expect(row).toHaveAttribute("href", "/admin/restaurants/r2");
    expect(within(table()).getByText("₹2,680")).toBeInTheDocument();
    expect(within(table()).getByText("Never")).toBeInTheDocument();
  });

  it("searches by name, city or contact", async () => {
    await renderList({ q: "udupi" });
    expect(within(table()).getAllByRole("row")).toHaveLength(2);
  });

  it("has empty states", async () => {
    getAdminRestaurants.mockResolvedValue([]);
    const first = await renderList();
    expect(screen.getByText("No restaurants yet")).toBeInTheDocument();
    first.unmount();
    getAdminRestaurants.mockResolvedValue(list);
    await renderList({ q: "zzz" });
    expect(screen.getByText("No restaurants match")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", async () => {
    const { container } = await renderList();
    expect(findUntranslated(container, { ignore: ["The Green Bowl", "Udupi Garden", "Fresh Fare Kitchen"] })).toEqual([]);
  });
});

describe("admin restaurant detail (the new page)", () => {
  const order = (id: string, over: Record<string, unknown> = {}) => ({
    id, cropType: "sunflower", quantityKg: 3, totalPrice: 1350, status: "DELIVERED", createdAt: ago(20), feedback: null as Record<string, unknown> | null, ...over,
  });
  const data = (orders: unknown[], over: Record<string, unknown> = {}) => ({
    id: "r1", businessName: "The Green Bowl", city: "Bengaluru", cuisineType: "Modern Indian", contactName: "Arjun Mehta", phone: "9000000021", address: "14, 80 Feet Road", pincode: "560095", gstin: null, user: { email: "arjun@example.com" }, orders, ...over,
  });
  const renderDetail = async () => render(await AdminRestaurantDetailPage({ params: { restaurantId: "r1" } }));

  beforeEach(() => getAdminRestaurant.mockReset());

  it("is a 404 for a restaurant that does not exist", async () => {
    getAdminRestaurant.mockResolvedValue(null);
    await expect(renderDetail()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("shows tiles: orders, revenue from paid orders only, rating, last order", async () => {
    getAdminRestaurant.mockResolvedValue(
      data([
        order("cmorder0001abcdef", { feedback: { id: "f1", rating: 5, notes: "Tags: Freshness\nLovely", createdAt: ago(18) } }),
        order("cmorder0002abcdef", { status: "PENDING_PAYMENT", totalPrice: 640, createdAt: ago(2) }),
      ])
    );
    await renderDetail();
    expect(screen.getByText("Orders").closest("div")!.parentElement).toHaveTextContent("2");
    expect(screen.getByText("1 paid")).toBeInTheDocument();
    expect(screen.getByText("Revenue").closest("div")!.parentElement).toHaveTextContent("₹1,350");
    expect(screen.getByText("Average rating").closest("div")!.parentElement).toHaveTextContent("5.0");
  });

  it("lists the order history with a downloadable invoice for paid orders only", async () => {
    getAdminRestaurant.mockResolvedValue(data([order("cmorder0001abcdef"), order("cmorder0002abcdef", { status: "PENDING_PAYMENT" })]));
    await renderDetail();
    const table = screen.getByRole("table", { name: "Order history" });
    const invoices = within(table).getAllByRole("link", { name: /Download invoice/ });
    expect(invoices).toHaveLength(1);
    expect(invoices[0]).toHaveAttribute("href", "/api/invoices/restaurant/cmorder0001abcdef");
  });

  it("shows the feedback left, with tags and the note", async () => {
    getAdminRestaurant.mockResolvedValue(data([order("cmorder0001abcdef", { feedback: { id: "f1", rating: 4, notes: "Tags: Quality, Packaging\nSturdier boxes please", createdAt: ago(18) } })]));
    await renderDetail();
    expect(screen.getByRole("img", { name: "Rated 4 of 5" })).toBeInTheDocument();
    expect(screen.getByText("Packaging")).toBeInTheDocument();
    expect(screen.getByText("Sturdier boxes please")).toBeInTheDocument();
  });

  it("says so for a restaurant that has never ordered", async () => {
    getAdminRestaurant.mockResolvedValue(data([]));
    await renderDetail();
    expect(screen.getByText("This restaurant has not placed an order yet.")).toBeInTheDocument();
    expect(screen.getByText("Has not ordered yet")).toBeInTheDocument();
    expect(screen.getByText("No feedback yet.")).toBeInTheDocument();
  });

  it("shows the contact details, and the GSTIN only when there is one", async () => {
    getAdminRestaurant.mockResolvedValue(data([]));
    const first = await renderDetail();
    expect(screen.getByText("arjun@example.com")).toBeInTheDocument();
    expect(screen.queryByText("GSTIN")).not.toBeInTheDocument();
    first.unmount();
    getAdminRestaurant.mockResolvedValue(data([], { gstin: "29ABCDE1234F1Z5" }));
    await renderDetail();
    expect(screen.getByText("GSTIN")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", async () => {
    getAdminRestaurant.mockResolvedValue(data([order("cmorder0001abcdef", { feedback: { id: "f1", rating: 4, notes: "Tags: Quality\nNice", createdAt: ago(18) } }), order("cmorder0002abcdef", { status: "PENDING_PAYMENT" })]));
    const { container } = await renderDetail();
    expect(findUntranslated(container)).toEqual([]);
  });
});
