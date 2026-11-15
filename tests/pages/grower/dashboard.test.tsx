import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { batch, daysFromNow, grower, payout, task } from "@/test/grower-fixtures";
import { findUntranslated } from "@/test/translation";

vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "user-1" } }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/shared/ImageUploader", () => ({ ImageUploader: () => null }));
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return { ...actual, ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div> };
});

const getGrowerHome = vi.fn();
vi.mock("@/lib/grower-data", () => ({ getGrowerHome: (...args: unknown[]) => getGrowerHome(...args) }));

import GrowerDashboard from "@/app/(dashboard)/grower/dashboard/page";

function home(overrides: Record<string, unknown> = {}) {
  return { grower: grower(), payouts: [payout()], scoredTrays: 3, notifications: [], ...overrides };
}

async function renderPage() {
  return render(await GrowerDashboard());
}

describe("grower dashboard", () => {
  beforeEach(() => getGrowerHome.mockReset());

  it("greets the grower and says in one sentence what is due", async () => {
    getGrowerHome.mockResolvedValue(home());
    await renderPage();
    expect(screen.getByRole("heading", { level: 1, name: /Good (morning|afternoon|evening)/ })).toBeInTheDocument();
    expect(screen.getByText("1 task needs a check-in today.")).toBeInTheDocument();
  });

  it("scopes the read to the signed-in user", async () => {
    getGrowerHome.mockResolvedValue(home());
    await renderPage();
    expect(getGrowerHome).toHaveBeenCalledWith("user-1");
  });

  it("shows four tiles with a plain caption each, linking to the page behind them", async () => {
    getGrowerHome.mockResolvedValue(home({ payouts: [payout({ amount: 120 }), payout({ id: "p2", status: "PENDING", amount: 30, paidAt: null })] }));
    await renderPage();
    const tiles = screen.getAllByRole("link").filter((a) => a.getAttribute("href") === "/grower/earnings");
    expect(tiles[0]).toHaveTextContent("₹120");
    expect(tiles[0]).toHaveTextContent("₹30 still pending");
    expect(screen.getByText("Active trays")).toBeInTheDocument();
    expect(screen.getByText("Photos for today are waiting")).toBeInTheDocument();
  });

  it("shows 'No scores yet' instead of a misleading score for a new grower", async () => {
    getGrowerHome.mockResolvedValue(home({ scoredTrays: 0, grower: grower({ qualityScore: 0.5 }) }));
    await renderPage();
    expect(screen.getByText(/No scores yet/)).toBeInTheDocument();
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
  });

  it("puts the check-in action inline on the dark Today's tasks card, and the row links to the task", async () => {
    getGrowerHome.mockResolvedValue(home());
    await renderPage();
    const card = screen.getByRole("region", { name: "Today's tasks" });
    expect(within(card).getByRole("link", { name: "Sunflower Shoots" })).toHaveAttribute("href", "/grower/tasks/task-1");
    expect(within(card).getByRole("button", { name: "Check in" })).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /View all tasks/ })).toHaveAttribute("href", "/grower/tasks");
  });

  it("offers pickup, not check-in, once the cycle is complete", async () => {
    getGrowerHome.mockResolvedValue(
      home({ grower: grower({ tasks: [task({ batches: [batch({ currentDay: 9 })] })] }) })
    );
    await renderPage();
    const card = screen.getByRole("region", { name: "Today's tasks" });
    expect(within(card).getByRole("button", { name: "Request Pickup" })).toBeInTheDocument();
    expect(within(card).queryByRole("button", { name: "Check in" })).not.toBeInTheDocument();
  });

  it("keeps a ready-for-pickup task visible", async () => {
    getGrowerHome.mockResolvedValue(home({ grower: grower({ tasks: [task({ status: "HARVEST_READY", batches: [batch({ currentDay: 9 })] })] }) }));
    await renderPage();
    expect(within(screen.getByRole("region", { name: "Today's tasks" })).getByText("Pickup requested")).toBeInTheDocument();
  });

  it("says so when nothing needs the grower", async () => {
    const checkedIn = batch({ checkIns: [{ createdAt: new Date() }] });
    getGrowerHome.mockResolvedValue(home({ grower: grower({ tasks: [task({ batches: [checkedIn] })] }) }));
    await renderPage();
    expect(screen.getByText("You are all caught up. Nothing is due today.")).toBeInTheDocument();
    expect(screen.getByText("Nothing needs you right now. Your trays are growing.")).toBeInTheDocument();
  });

  it("shows the grow-cycle ring with the day count", async () => {
    getGrowerHome.mockResolvedValue(home());
    await renderPage();
    expect(screen.getByRole("img", { name: "33% of the grow cycle" })).toBeInTheDocument();
    expect(screen.getAllByText("Day 3 of 9").length).toBeGreaterThan(0);
  });

  it("builds Recent activity from notifications, not from the task list again", async () => {
    getGrowerHome.mockResolvedValue(
      home({ notifications: [{ id: "n1", title: "Payout sent", message: "₹50 for Tray 1", createdAt: daysFromNow(-1) }] })
    );
    await renderPage();
    expect(screen.getByText("Payout sent")).toBeInTheDocument();
    expect(screen.getByText("₹50 for Tray 1")).toBeInTheDocument();
  });

  it("charts earnings by week with range pills", async () => {
    getGrowerHome.mockResolvedValue(home());
    await renderPage();
    expect(screen.getByRole("heading", { name: "Weekly earnings" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "8 weeks" })).toBeChecked();
    expect(screen.getByRole("img", { name: /Weekly earnings for the last 8 weeks. Total ₹50./ })).toBeInTheDocument();
  });

  it("explains an empty chart", async () => {
    getGrowerHome.mockResolvedValue(home({ payouts: [] }));
    await renderPage();
    expect(screen.getByText("No earnings in this period")).toBeInTheDocument();
  });

  it("handles a signed-in user with no grower profile", async () => {
    getGrowerHome.mockResolvedValue(null);
    await renderPage();
    expect(screen.getByText("No grower profile found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Join as a grower" })).toHaveAttribute("href", "/join/grower");
  });

  it("has Kannada and Hindi for everything it says", async () => {
    getGrowerHome.mockResolvedValue(
      home({ notifications: [{ id: "n1", title: "Payout sent", message: "₹50 for Tray 1", createdAt: daysFromNow(-1) }] })
    );
    const { container } = await renderPage();
    // Notification text is written by the system, not part of this page's interface copy.
    expect(findUntranslated(container, { ignore: ["Payout sent", "₹50 for Tray 1"] })).toEqual([]);
  });
});
