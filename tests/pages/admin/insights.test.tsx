import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { weeklyTotals } from "@/lib/admin";
import { findUntranslated } from "@/test/translation";

const { getAdminAnalytics, getKpiSnapshot } = vi.hoisted(() => ({ getAdminAnalytics: vi.fn(), getKpiSnapshot: vi.fn() }));
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return { ...actual, ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div> };
});
vi.mock("@/lib/admin-data", () => ({ getAdminAnalytics: (...a: unknown[]) => getAdminAnalytics(...a), getKpiSnapshot: (...a: unknown[]) => getKpiSnapshot(...a) }));

import AnalyticsPage from "@/app/(dashboard)/admin/analytics/page";
import AdminKpisPage from "@/app/(dashboard)/admin/kpis/page";

const NOW = new Date();
const weeks = (rows: { at: Date; value: number }[]) => weeklyTotals(rows, NOW, 12);
const ago = (d: number) => new Date(NOW.getTime() - d * 86400000);

const analytics = (over: Record<string, unknown> = {}) => ({
  revenue: weeks([{ at: ago(10), value: 1350 }, { at: ago(1), value: 1330 }]),
  payouts: weeks([{ at: ago(8), value: 850 }, { at: ago(1), value: 1000 }]),
  orders: weeks([{ at: ago(10), value: 1 }, { at: ago(1), value: 1 }]),
  orderedKg: weeks([{ at: ago(10), value: 3 }, { at: ago(1), value: 3.5 }]),
  deliveredKg: weeks([{ at: ago(9), value: 3 }]),
  crops: [{ cropType: "sunflower", revenue: 1350, kg: 3, orders: 1 }, { cropType: "pea-shoots", revenue: 1330, kg: 3.5, orders: 1 }],
  topRestaurants: [{ id: "r1", name: "The Green Bowl", revenue: 2680, orders: 2 }],
  qc: { PASS: 37, RISK: 2, REJECT: 5 },
  growerQuality: [{ id: "g1", name: "Lakshmi Venkatesh", quality: 0.94, finished: 18 }],
  rating: 4.5,
  ratingCount: 2,
  ...over,
});
const renderAnalytics = async (tab?: string) => render(await AnalyticsPage({ searchParams: { tab } }));

describe("admin analytics", () => {
  beforeEach(() => getAdminAnalytics.mockReset().mockResolvedValue(analytics()));

  it("leads with four tiles: revenue, paid to growers, what is kept, and orders", async () => {
    await renderAnalytics();
    expect(screen.getByText("₹2,680", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("₹1,850", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("₹830", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("31% of revenue")).toBeInTheDocument();
  });

  it("puts revenue, production and quality in tabs", async () => {
    await renderAnalytics();
    const tabs = screen.getByRole("tablist", { name: "Analytics sections" });
    expect(within(tabs).getAllByRole("tab").map((t) => t.getAttribute("href"))).toEqual(["/admin/analytics?tab=revenue", "/admin/analytics?tab=production", "/admin/analytics?tab=quality"]);
  });

  it("charts revenue against payouts, with the amount kept, and orders over time", async () => {
    await renderAnalytics();
    expect(screen.getByRole("heading", { name: "Revenue and grower payouts" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Orders over time" })).toBeInTheDocument();
    expect(screen.getByText("Kept").parentElement).toHaveTextContent(/₹\d/);
  });

  it("ranks restaurants and crops by revenue", async () => {
    await renderAnalytics();
    expect(screen.getByRole("link", { name: "The Green Bowl" })).toHaveAttribute("href", "/admin/restaurants/r1");
    expect(screen.getByRole("heading", { name: "Revenue by crop" }).closest(".panel")).toHaveTextContent("Sunflower Shoots");
  });

  it("shows ordered against delivered kilos and kilos by crop on the production tab", async () => {
    await renderAnalytics("production");
    expect(screen.getByRole("heading", { name: "Weekly volume" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Kilos by crop" })).toBeInTheDocument();
  });

  it("shows QC results and grower quality on the quality tab", async () => {
    await renderAnalytics("quality");
    const qc = screen.getByRole("heading", { name: "QC results" }).closest(".panel") as HTMLElement;
    expect(qc).toHaveTextContent("37");
    expect(screen.getByRole("link", { name: "Lakshmi Venkatesh" })).toHaveAttribute("href", "/admin/growers/g1");
    expect(screen.getByText(/Restaurants rate deliveries 4.5 out of 5/)).toBeInTheDocument();
  });

  it("does not repeat the dashboard's tiles under other names", async () => {
    await renderAnalytics();
    expect(screen.queryByText("QC pass rate")).not.toBeInTheDocument();
    expect(screen.queryByText("Growers")).not.toBeInTheDocument();
  });

  it("handles a platform with no data without invented numbers", async () => {
    getAdminAnalytics.mockResolvedValue(analytics({ revenue: weeks([]), payouts: weeks([]), orders: weeks([]), crops: [], topRestaurants: [], qc: {}, growerQuality: [], ratingCount: 0, rating: null }));
    const first = await renderAnalytics();
    expect(screen.getByText("Nothing earned yet")).toBeInTheDocument();
    expect(screen.getAllByText("No paid orders yet.")).toHaveLength(2);
    first.unmount();
    await renderAnalytics("quality");
    expect(screen.getByText("No check-ins have been reviewed yet.")).toBeInTheDocument();
    expect(screen.getByText("No trays have finished yet.")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says, on every tab", async () => {
    for (const tab of ["revenue", "production", "quality"]) {
      const { container, unmount } = await renderAnalytics(tab);
      expect(findUntranslated(container, { ignore: ["The Green Bowl", "Lakshmi Venkatesh"] }), tab).toEqual([]);
      unmount();
    }
  });
});

describe("admin KPI scorecard", () => {
  const snapshot = (over: Record<string, unknown> = {}) => ({
    kgDeliveredPerWeek: { value: 6.5, weeks: [0, 0, 3, 3.5] },
    qcPassRate: { value: 0.88, sampleSize: 42 },
    onTimeDeliveryRate: { value: 1, sampleSize: 2 },
    activeCertifiedGrowers: { value: 14 },
    growerAcceptanceRate: { value: null, note: "Not trackable yet." },
    mrr: { value: 10465 },
    restaurantChurnRate: { value: null, cohortSize: 0 },
    ...over,
  });
  beforeEach(() => getKpiSnapshot.mockReset().mockResolvedValue(snapshot()));
  const renderKpis = async () => render(await AdminKpisPage());

  it("shows seven tiles, each with its value, target and verdict", async () => {
    await renderKpis();
    const tiles = screen.getAllByRole("listitem").filter((li) => li.className.includes("rounded-tile"));
    expect(tiles).toHaveLength(7);
    const qc = tiles.find((t) => t.textContent?.includes("QC pass rate"))!;
    expect(qc).toHaveTextContent("88%");
    expect(qc).toHaveTextContent("Below target");
    const onTime = tiles.find((t) => t.textContent?.includes("On-time delivery"))!;
    expect(onTime).toHaveTextContent("Target met");
  });

  it("says 'No data yet' instead of 0% for what cannot be measured", async () => {
    await renderKpis();
    const acceptance = screen.getAllByRole("listitem").find((t) => t.textContent?.includes("Grower acceptance rate") && t.className.includes("rounded-tile"))!;
    expect(acceptance).toHaveTextContent("No data yet");
    expect(acceptance).toHaveTextContent("—");
  });

  it("leads with how many measured KPIs are on target", async () => {
    await renderKpis();
    expect(screen.getByText(/1 of 5 measured KPIs are on target/)).toBeInTheDocument();
  });

  it("keeps the explanations in a Definitions accordion instead of a wide table", async () => {
    const { container } = await renderKpis();
    expect(container.querySelector("table")).toBeNull();
    const definitions = screen.getByRole("heading", { name: "Definitions" }).closest(".panel") as HTMLElement;
    expect(definitions.querySelectorAll("details")).toHaveLength(7);
    expect(definitions).toHaveTextContent("A stand-in");
  });

  it("has Kannada and Hindi for everything it says", async () => {
    const { container } = await renderKpis();
    expect(findUntranslated(container)).toEqual([]);
  });
});
