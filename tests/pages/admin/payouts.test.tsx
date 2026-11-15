import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

const { refresh, toast, markPayoutsAsPaid, getAdminPayouts, getAdminSettlements } = vi.hoisted(() => ({
  refresh: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  markPayoutsAsPaid: vi.fn(),
  getAdminPayouts: vi.fn(),
  getAdminSettlements: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace: vi.fn() }), usePathname: () => "/admin/payouts", useSearchParams: () => new URLSearchParams() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/actions/payout.actions", () => ({ markPayoutsAsPaid: (...a: unknown[]) => markPayoutsAsPaid(...a) }));
vi.mock("@/lib/admin-data", () => ({ getAdminPayouts: (...a: unknown[]) => getAdminPayouts(...a), getAdminSettlements: (...a: unknown[]) => getAdminSettlements(...a) }));

import PayoutsPage from "@/app/(dashboard)/admin/payouts/page";

const row = (id: string, name: string, over: Record<string, unknown> = {}) => ({
  id, growerId: `g-${id}`, growerName: name, cropType: "sunflower", trayNumber: 3, createdAt: new Date(2026, 9, 23).toISOString(), status: "PENDING", amount: 50, ...over,
});
const totals = (over: Record<string, unknown> = {}) => ({ pendingAmount: 150, paidAmount: 1850, failedAmount: 0, pendingCount: 3, paidCount: 37, failedCount: 0, ...over });
const settlement = {
  order: { id: "cmorder0001abcdef", cropType: "sunflower", quantityKg: 3, totalPrice: 1350, restaurant: { businessName: "The Green Bowl" } },
  growers: [{ taskId: "t1", name: "Lakshmi Venkatesh", amount: 400 }, { taskId: "t2", name: "Suresh Gowda", amount: 300 }],
  paidOut: 850, share: 500,
};
const table = () => screen.getByRole("table", { name: "Payouts" });
const renderPage = async (searchParams: Record<string, string> = {}) => render(await PayoutsPage({ searchParams }));

describe("admin payouts", () => {
  beforeEach(() => {
    refresh.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    markPayoutsAsPaid.mockReset().mockResolvedValue({ count: 2 });
    getAdminPayouts.mockReset().mockResolvedValue({ rows: [row("p1", "Lakshmi Venkatesh"), row("p2", "Suresh Gowda"), row("p3", "Anitha Reddy")], totals: totals() });
    getAdminSettlements.mockReset().mockResolvedValue([settlement]);
  });

  it("opens on the pending payouts and passes the filter and search to the query", async () => {
    await renderPage();
    expect(getAdminPayouts).toHaveBeenCalledWith("pending", "");
    getAdminPayouts.mockClear();
    await renderPage({ status: "paid", q: "lakshmi" });
    expect(getAdminPayouts).toHaveBeenCalledWith("paid", "lakshmi");
  });

  it("totals over every payout, not just the rows loaded, and says what is waiting", async () => {
    await renderPage();
    expect(screen.getByText("₹150 is waiting to be paid to growers.")).toBeInTheDocument();
    expect(screen.getByText("₹150", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("₹1,850", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("37 payouts so far")).toBeInTheDocument();
  });

  it("counts each status on its chip", async () => {
    await renderPage();
    const chips = screen.getByRole("group", { name: "Filter payouts" });
    expect(within(chips).getByRole("link", { name: /Pending/ })).toHaveTextContent("3");
    expect(within(chips).getByRole("link", { name: /Paid/ })).toHaveTextContent("37");
    expect(within(chips).getByRole("link", { name: /Failed/ })).toHaveTextContent("0");
  });

  it("shows the crop and tray on each payout", async () => {
    await renderPage();
    expect(within(table()).getAllByText(/Sunflower Shoots · Tray 3/).length).toBeGreaterThan(0);
  });

  it("selects payouts and marks them paid only after a confirmation that names the count and the total", async () => {
    await renderPage();
    fireEvent.click(within(table()).getByRole("checkbox", { name: "Select Lakshmi Venkatesh, ₹50" }));
    fireEvent.click(within(table()).getByRole("checkbox", { name: "Select Suresh Gowda, ₹50" }));
    expect(screen.getByText("2 selected · ₹100")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mark paid (2)" }));
    expect(markPayoutsAsPaid).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", { name: "Mark payouts as paid" });
    expect(dialog).toHaveTextContent("2 payouts totalling ₹100");
    fireEvent.click(within(dialog).getByRole("button", { name: "Mark 2 as paid" }));
    await waitFor(() => expect(markPayoutsAsPaid).toHaveBeenCalledWith(["p1", "p2"]));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("2 payouts marked paid");
  });

  it("selects everything with the header box", async () => {
    await renderPage();
    fireEvent.click(within(table()).getByRole("checkbox", { name: "Select all" }));
    expect(screen.getByText("3 selected · ₹150")).toBeInTheDocument();
  });

  it("does nothing when the confirmation is cancelled", async () => {
    await renderPage();
    fireEvent.click(within(table()).getByRole("checkbox", { name: "Select Lakshmi Venkatesh, ₹50" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark paid (1)" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    expect(markPayoutsAsPaid).not.toHaveBeenCalled();
  });

  it("shows the server's message and keeps the selection when paying fails", async () => {
    markPayoutsAsPaid.mockResolvedValue({ error: "Unauthorized", count: 0 });
    await renderPage();
    fireEvent.click(within(table()).getByRole("checkbox", { name: "Select Lakshmi Venkatesh, ₹50" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark paid (1)" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Mark 1 as paid" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Unauthorized"));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("offers no selection on the paid list: there is nothing to mark", async () => {
    getAdminPayouts.mockResolvedValue({ rows: [row("p1", "Lakshmi Venkatesh", { status: "PAID" })], totals: totals() });
    await renderPage({ status: "paid" });
    expect(within(table()).queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("keeps the order settlements with their invoice, settlement and per-grower statement links", async () => {
    await renderPage();
    const section = screen.getByRole("heading", { name: "Order settlements" }).closest("section")!;
    expect(within(section).getByRole("link", { name: "Settlement" })).toHaveAttribute("href", "/api/invoices/platform/cmorder0001abcdef");
    expect(within(section).getByRole("link", { name: "Restaurant invoice" })).toHaveAttribute("href", "/api/invoices/restaurant/cmorder0001abcdef");
    expect(within(section).getByRole("link", { name: "Download payout statement for Suresh Gowda" })).toHaveAttribute("href", "/api/invoices/grower/t2");
    expect(section).toHaveTextContent("₹500");
  });

  it("says everything is paid when nothing is pending, and hides an empty Failed tile", async () => {
    getAdminPayouts.mockResolvedValue({ rows: [], totals: totals({ pendingAmount: 0, pendingCount: 0 }) });
    await renderPage();
    expect(screen.getByText("Every grower has been paid.")).toBeInTheDocument();
    expect(screen.queryByText("Failed", { selector: "span.truncate" })).toBeNull();
  });

  it("has Kannada and Hindi for everything it says", async () => {
    const { container } = await renderPage();
    fireEvent.click(within(table()).getByRole("checkbox", { name: "Select Lakshmi Venkatesh, ₹50" }));
    expect(findUntranslated(container, { ignore: ["Lakshmi Venkatesh", "Suresh Gowda", "Anitha Reddy", "The Green Bowl", "CMORDER0", "Lakshmi Venkatesh · ₹400", "Suresh Gowda · ₹300"] })).toEqual([]);
  });
});
