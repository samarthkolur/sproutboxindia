import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { daysFromNow, payout } from "@/test/grower-fixtures";
import { findUntranslated } from "@/test/translation";

vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "user-1" } }) }));
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return { ...actual, ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div> };
});

const getGrowerEarnings = vi.fn();
vi.mock("@/lib/grower-data", () => ({ getGrowerEarnings: (...args: unknown[]) => getGrowerEarnings(...args) }));

import GrowerEarningsPage from "@/app/(dashboard)/grower/earnings/page";

async function renderPage() {
  return render(await GrowerEarningsPage());
}

const paid = payout({ id: "p1", amount: 120 });
const pending = payout({ id: "p2", amount: 80, status: "PENDING", paidAt: null, batch: { trayNumber: 2, task: { id: "task-2", cropType: "radish" } } });

describe("grower earnings", () => {
  beforeEach(() => getGrowerEarnings.mockReset());

  it("leads with what has been paid, and says what is pending in a sentence", async () => {
    getGrowerEarnings.mockResolvedValue([paid, pending]);
    await renderPage();
    expect(screen.getByText("Total earned").parentElement).toHaveTextContent("₹120");
    expect(screen.getByText("₹80 is pending and will be paid after quality control.")).toBeInTheDocument();
  });

  it("scopes the read to the signed-in user", async () => {
    getGrowerEarnings.mockResolvedValue([paid]);
    await renderPage();
    expect(getGrowerEarnings).toHaveBeenCalledWith("user-1");
  });

  it("names the crop and tray on each payout, not 'Batch Payout'", async () => {
    getGrowerEarnings.mockResolvedValue([paid, pending]);
    await renderPage();
    expect(screen.queryByText("Batch Payout")).not.toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Payout history" });
    expect(within(table).getByText("Sunflower Shoots")).toBeInTheDocument();
    expect(within(table).getByText("Radish")).toBeInTheDocument();
  });

  it("links each payout row to the task it belongs to", async () => {
    getGrowerEarnings.mockResolvedValue([paid, pending]);
    await renderPage();
    const table = screen.getByRole("table", { name: "Payout history" });
    expect(within(table).getByRole("link", { name: "Radish, tray 2, ₹80" })).toHaveAttribute("href", "/grower/tasks/task-2");
  });

  it("shows paid and pending payouts with their status", async () => {
    getGrowerEarnings.mockResolvedValue([paid, pending]);
    await renderPage();
    const table = screen.getByRole("table", { name: "Payout history" });
    expect(within(table).getByText("Paid")).toBeInTheDocument();
    expect(within(table).getByText("Pending")).toBeInTheDocument();
  });

  it("charts the paid amounts by week", async () => {
    getGrowerEarnings.mockResolvedValue([paid, payout({ id: "p3", amount: 30, paidAt: daysFromNow(-10) })]);
    await renderPage();
    expect(screen.getByRole("img", { name: /Total ₹150/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "12 weeks" })).toBeInTheDocument();
  });

  it("offers one downloadable payout statement per task, linking to the document", async () => {
    getGrowerEarnings.mockResolvedValue([paid, payout({ id: "p9", batchId: "b9", amount: 50 }), pending]);
    await renderPage();
    const panel = screen.getByRole("heading", { name: "Payout statements" }).closest(".panel") as HTMLElement;
    const sunflower = within(panel).getByRole("link", { name: "Download payout statement for Sunflower Shoots" });
    expect(sunflower).toHaveAttribute("href", "/api/invoices/grower/task-1");
    expect(sunflower).toHaveAttribute("download");
    expect(within(panel).getByText("2 trays · ₹170".replace("170", "170"))).toBeInTheDocument();
    expect(within(panel).getByRole("link", { name: "Download payout statement for Radish" })).toHaveAttribute("href", "/api/invoices/grower/task-2");
  });

  it("shows no statements panel before the first payout", async () => {
    getGrowerEarnings.mockResolvedValue([]);
    await renderPage();
    expect(screen.queryByRole("heading", { name: "Payout statements" })).not.toBeInTheDocument();
  });

  it("explains the first-run state", async () => {
    getGrowerEarnings.mockResolvedValue([]);
    await renderPage();
    expect(screen.getByText("Total earned").parentElement).toHaveTextContent("₹0");
    expect(screen.getByText("Nothing is pending right now.")).toBeInTheDocument();
    expect(screen.getByText("No payouts yet")).toBeInTheDocument();
  });

  it("does not crash for a user with no grower profile", async () => {
    getGrowerEarnings.mockResolvedValue(null);
    await renderPage();
    expect(screen.getByText("No payouts yet")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", async () => {
    getGrowerEarnings.mockResolvedValue([paid, pending]);
    const { container } = await renderPage();
    expect(findUntranslated(container)).toEqual([]);
  });
});
