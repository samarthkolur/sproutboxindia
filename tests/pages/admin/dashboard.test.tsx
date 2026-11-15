import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { weeklyTotals } from "@/lib/admin";
import { findUntranslated } from "@/test/translation";

vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "admin-1" } }) }));
const getAdminOverview = vi.fn();
vi.mock("@/lib/admin-data", () => ({ getAdminOverview: (...a: unknown[]) => getAdminOverview(...a) }));

import AdminDashboard from "@/app/(dashboard)/admin/dashboard/page";

const NOW = new Date();
const overview = (overrides: Record<string, unknown> = {}) => ({
  pipeline: { demand: 5, allocate: 3, dispatch: 0, qc: 1, payout: 0 },
  orderTotals: 16,
  revenue: 10465,
  activeOrders: 14,
  traysGrowing: 41,
  growers: 14,
  activeGrowers: 14,
  qcRate: 88,
  qcReviewed: 42,
  inTransit: 0,
  weeks: { orderedKg: weeklyTotals([], NOW, 12), deliveredKg: weeklyTotals([], NOW, 12) },
  recentOrders: [
    { id: "cmorder0001abcdef", cropType: "sunflower", quantityKg: 3, totalPrice: 1350, status: "DELIVERED", createdAt: NOW, restaurant: { id: "rest-1", businessName: "The Green Bowl" } },
  ],
  topGrowers: [{ id: "g1", name: "Lakshmi Venkatesh", city: "Bengaluru", score: 0.98, trays: 18 }],
  activity: [{ id: "n1", title: "Pickup Requested", message: "Grower abc requested pickup", createdAt: NOW }],
  ...overrides,
});
const load = (o: Record<string, unknown> = {}) => getAdminOverview.mockResolvedValue(overview(o));
const renderPage = async () => render(await AdminDashboard());

describe("admin dashboard", () => {
  beforeEach(() => getAdminOverview.mockReset());

  it("reads the overview for the signed-in admin", async () => {
    load();
    await renderPage();
    expect(getAdminOverview).toHaveBeenCalledWith("admin-1", expect.any(Date));
  });

  it("says in one sentence what is waiting", async () => {
    load();
    await renderPage();
    const subtitle = screen.getByText("5 orders need a plan").parentElement!.parentElement!;
    expect(subtitle).toHaveTextContent("5 orders need a plan, 3 plans need growers, 1 tray is waiting for QC.");
  });

  it("shows the pipeline in order, each step a link with its count", async () => {
    load();
    await renderPage();
    const steps = within(screen.getByRole("navigation", { name: "Pipeline" })).getAllByRole("link");
    expect(steps.map((a) => a.getAttribute("href"))).toEqual(["/admin/demand", "/admin/allocate", "/admin/dispatch", "/admin/qc", "/admin/payouts"]);
    expect(steps[0]).toHaveTextContent("1. Demand");
    expect(steps[0]).toHaveTextContent("5");
    expect(steps[2]).toHaveTextContent("Nothing waiting");
  });

  it("says everything is up to date when nothing is waiting", async () => {
    load({ pipeline: { demand: 0, allocate: 0, dispatch: 0, qc: 0, payout: 0 } });
    await renderPage();
    expect(screen.getByText(/Everything is up to date/)).toBeInTheDocument();
  });

  it("shows real figures with no invented trend", async () => {
    load();
    await renderPage();
    expect(screen.getByText("Revenue").closest("div")!.parentElement).toHaveTextContent("₹10,465");
    expect(screen.queryByText(/\+12/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\+18%/)).not.toBeInTheDocument();
    expect(screen.getByText("Trays growing").closest("div")!.parentElement).toHaveTextContent("41");
  });

  it("tints the QC rate by the target, and shows a dash before any review", async () => {
    load({ qcRate: 88 });
    const first = await renderPage();
    expect(screen.getByText("Below the 90% target")).toBeInTheDocument();
    first.unmount();
    load({ qcRate: null });
    await renderPage();
    expect(screen.getByText("No trays reviewed yet")).toBeInTheDocument();
  });

  it("charts ordered and delivered kilos by week with range pills", async () => {
    load();
    await renderPage();
    expect(screen.getByRole("heading", { name: "Weekly volume" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "8 weeks" })).toBeChecked();
  });

  it("links recent orders to the restaurant, and growers to their page", async () => {
    load();
    await renderPage();
    expect(screen.getByRole("link", { name: "The Green Bowl" })).toHaveAttribute("href", "/admin/restaurants/rest-1");
    const grower = screen.getByRole("link", { name: "Lakshmi Venkatesh" });
    expect(grower).toHaveAttribute("href", "/admin/growers/g1");
    expect(screen.getByText("Bengaluru · 18 trays")).toBeInTheDocument(); // trays, not the number of tasks
  });

  it("shows activity from the admin's own notifications", async () => {
    load();
    await renderPage();
    expect(screen.getByText("Pickup Requested")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", async () => {
    load();
    const { container } = await renderPage();
    expect(findUntranslated(container, { ignore: ["Pickup Requested", "Grower abc requested pickup", "The Green Bowl", "Lakshmi Venkatesh", "Bengaluru · 18 trays"] })).toEqual([]);
  });
});
