import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

const { refresh, toast, actions, getAdminGrowers, getAdminGrower } = vi.hoisted(() => ({
  refresh: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  actions: { verifyGrowerFssai: vi.fn(), setGrowerActive: vi.fn() },
  getAdminGrowers: vi.fn(),
  getAdminGrower: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, replace: vi.fn() }),
  usePathname: () => "/admin/growers",
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/actions/grower.actions", () => actions);
vi.mock("@/lib/admin-data", () => ({ getAdminGrowers: (...a: unknown[]) => getAdminGrowers(...a), getAdminGrower: (...a: unknown[]) => getAdminGrower(...a) }));

import AdminGrowersPage from "@/app/(dashboard)/admin/growers/page";
import AdminGrowerDetailPage from "@/app/(dashboard)/admin/growers/[growerId]/page";

const day = 86400000;
const row = (id: string, name: string, over: Record<string, unknown> = {}) => ({
  id, name, email: `${id}@example.com`, city: "Bengaluru", kitSize: 15, activeTrays: 4, compositeScore: 0.94, scoredTrays: 12,
  fssaiRegNumber: null as string | null, fssaiVerifiedAt: null as Date | null, isActive: true, ...over,
});
const rows = [
  row("g1", "Lakshmi Venkatesh", { fssaiRegNumber: "12345678901234", fssaiVerifiedAt: new Date() }),
  row("g2", "Suresh Gowda", { fssaiRegNumber: "99999999999999" }),
  row("g3", "Anitha Reddy", { compositeScore: 0.5, scoredTrays: 0 }),
  row("g4", "Meera Krishnan", { isActive: false }),
];
const renderList = async (searchParams: Record<string, string> = {}) => render(await AdminGrowersPage({ searchParams }));
const table = () => screen.getByRole("table", { name: "Growers" });

describe("admin growers list", () => {
  beforeEach(() => {
    refresh.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    actions.verifyGrowerFssai.mockReset().mockResolvedValue({ success: true });
    getAdminGrowers.mockReset().mockResolvedValue(rows);
  });

  it("counts each filter and leads with how many numbers await verification", async () => {
    await renderList();
    expect(screen.getByText("1 FSSAI number is waiting to be verified.")).toBeInTheDocument();
    const chips = screen.getByRole("group", { name: "Filter growers" });
    const count = (n: RegExp) => within(chips).getByRole("link", { name: n });
    expect(count(/^All/)).toHaveTextContent("4");
    expect(count(/FSSAI verified/)).toHaveTextContent("1");
    expect(count(/FSSAI pending/)).toHaveTextContent("1");
    expect(count(/No FSSAI/)).toHaveTextContent("2");
    expect(count(/Inactive/)).toHaveTextContent("1");
  });

  it("makes Pending the verification queue: filter, then verify inline", async () => {
    await renderList({ status: "pending" });
    expect(within(table()).getAllByRole("row")).toHaveLength(2);
    expect(within(table()).getByText("Suresh Gowda")).toBeInTheDocument();
    fireEvent.click(within(table()).getByRole("button", { name: "Verify FSSAI for Suresh Gowda" }));
    const dialog = screen.getByRole("dialog", { name: "Verify FSSAI registration" });
    expect(within(dialog).getByText("99999999999999")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Mark verified" }));
    await waitFor(() => expect(actions.verifyGrowerFssai).toHaveBeenCalledWith("g2"));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("asks before verifying and does nothing if cancelled", async () => {
    await renderList({ status: "pending" });
    fireEvent.click(within(table()).getByRole("button", { name: "Verify FSSAI for Suresh Gowda" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    expect(actions.verifyGrowerFssai).not.toHaveBeenCalled();
  });

  it("shows the server's reason when verifying fails", async () => {
    actions.verifyGrowerFssai.mockResolvedValue({ error: "Unauthorized" });
    await renderList({ status: "pending" });
    fireEvent.click(within(table()).getByRole("button", { name: "Verify FSSAI for Suresh Gowda" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Mark verified" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Unauthorized"));
  });

  it("offers Verify only on a number that is waiting", async () => {
    await renderList();
    expect(within(table()).getAllByRole("button", { name: /Verify FSSAI for/ })).toHaveLength(1);
  });

  it("shows kit use, a score with a meter, and a dash instead of a default score", async () => {
    await renderList();
    expect(within(table()).getAllByText("4 of 15 trays").length).toBeGreaterThan(0);
    expect(within(table()).getAllByText("94%").length).toBeGreaterThan(0);
    expect(within(table()).getByText("No scores yet")).toBeInTheDocument();
  });

  it("shows whether each grower is active, and links to their page", async () => {
    await renderList({ status: "inactive" });
    expect(within(table()).getByText("Inactive")).toBeInTheDocument();
    expect(within(table()).getByRole("link", { name: "Meera Krishnan" })).toHaveAttribute("href", "/admin/growers/g4");
  });

  it("searches by name, email or city", async () => {
    await renderList({ q: "suresh" });
    expect(within(table()).getAllByRole("row")).toHaveLength(2);
    expect(within(table()).getByText("Suresh Gowda")).toBeInTheDocument();
  });

  it("has an empty state before anyone has joined, and for a filter with no match", async () => {
    getAdminGrowers.mockResolvedValue([]);
    const first = await renderList();
    expect(screen.getByText("No growers yet")).toBeInTheDocument();
    first.unmount();
    getAdminGrowers.mockResolvedValue(rows);
    await renderList({ q: "zzz" });
    expect(screen.getByText("No growers match")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", async () => {
    const { container } = await renderList();
    expect(findUntranslated(container, { ignore: [...rows.map((r) => r.name), "Bengaluru"] })).toEqual([]);
  });
});

describe("admin grower detail", () => {
  const detail = (over: Record<string, unknown> = {}, grower: Record<string, unknown> = {}) => ({
    scoredTrays: 12,
    ...over,
    grower: {
      id: "g1", user: { name: "Lakshmi Venkatesh", email: "lakshmi@example.com" }, cluster: { name: "Koramangala Cluster" }, city: "Bengaluru", address: "27, 4th Cross", pincode: "560034", phone: "9000000001",
      kitSize: 15, isActive: true, joinedAt: new Date(Date.now() - 60 * day), yieldScore: 0.99, qualityScore: 0.94, timelinessScore: 1, compositeScore: 0.98, totalEarnings: 850,
      fssaiRegNumber: "12345678901234", fssaiVerifiedAt: null,
      tasks: [{ id: "t1", cropType: "sunflower", trayCount: 8, sowDate: new Date(Date.now() - 20 * day), status: "HARVESTED", plan: { orderId: "o1", order: { restaurant: { businessName: "The Green Bowl" } } } }],
      payouts: [
        { id: "p1", amount: 50, status: "PAID", paidAt: new Date(Date.now() - 18 * day), createdAt: new Date(Date.now() - 20 * day), batch: { trayNumber: 3, task: { id: "t1", cropType: "sunflower" } } },
        { id: "p2", amount: 50, status: "PENDING", paidAt: null, createdAt: new Date(Date.now() - 2 * day), batch: { trayNumber: 4, task: { id: "t1", cropType: "sunflower" } } },
      ],
      ...grower,
    },
  });
  const renderDetail = async (tab?: string) => render(await AdminGrowerDetailPage({ params: { growerId: "g1" }, searchParams: { tab } }));

  beforeEach(() => {
    getAdminGrower.mockReset().mockResolvedValue(detail());
    actions.verifyGrowerFssai.mockReset().mockResolvedValue({ success: true });
    actions.setGrowerActive.mockReset().mockResolvedValue({ success: true });
  });

  it("is a 404 for a grower that does not exist", async () => {
    getAdminGrower.mockResolvedValue(null);
    await expect(renderDetail()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("shows tinted tiles with a caption each, including what was earned and what is pending", async () => {
    await renderDetail();
    expect(screen.getByText("Overall").closest("div")!.parentElement).toHaveTextContent("98%");
    expect(screen.getByText("Earned").closest("div")!.parentElement).toHaveTextContent("₹50");
    expect(screen.getByText("₹50 still pending")).toBeInTheDocument();
  });

  it("shows dashes, not default scores, for a grower with no finished tray", async () => {
    getAdminGrower.mockResolvedValue(detail({ scoredTrays: 0 }, { yieldScore: 0.5, qualityScore: 0.5, timelinessScore: 0.5, compositeScore: 0.5 }));
    await renderDetail();
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
  });

  it("shows the tasks and payouts that used to be fetched and never displayed", async () => {
    const first = await renderDetail();
    expect(within(screen.getByRole("table", { name: "Tasks" })).getByText("Sunflower Shoots")).toBeInTheDocument();
    first.unmount();
    await renderDetail("payouts");
    const payouts = screen.getByRole("table", { name: "Payouts" });
    expect(within(payouts).getAllByRole("row")).toHaveLength(3);
    expect(within(payouts).getByText("Pending")).toBeInTheDocument();
  });

  it("puts tasks, payouts and compliance in tabs", async () => {
    await renderDetail();
    const tabs = screen.getByRole("tablist", { name: "Grower sections" });
    expect(within(tabs).getAllByRole("tab").map((a) => a.getAttribute("href"))).toEqual(["/admin/growers/g1?tab=tasks", "/admin/growers/g1?tab=payouts", "/admin/growers/g1?tab=compliance"]);
  });

  it("verifies FSSAI from the compliance tab", async () => {
    await renderDetail("compliance");
    expect(screen.getByText("FSSAI pending")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Verify FSSAI for/ }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Mark verified" }));
    await waitFor(() => expect(actions.verifyGrowerFssai).toHaveBeenCalledWith("g1"));
  });

  it("pauses a grower from the compliance tab", async () => {
    await renderDetail("compliance");
    fireEvent.click(screen.getByRole("switch", { name: "Active" }));
    await waitFor(() => expect(actions.setGrowerActive).toHaveBeenCalledWith("g1", false));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Grower paused", expect.anything()));
  });

  it("puts the switch back when pausing fails", async () => {
    actions.setGrowerActive.mockResolvedValue({ error: "Unauthorized" });
    await renderDetail("compliance");
    fireEvent.click(screen.getByRole("switch", { name: "Active" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Unauthorized"));
    expect(screen.getByRole("switch", { name: "Active" })).toBeChecked();
  });

  it("shows contact details", async () => {
    await renderDetail();
    expect(screen.getByText("lakshmi@example.com")).toBeInTheDocument();
    expect(screen.getByText("9000000001")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says, on every tab", async () => {
    for (const tab of ["tasks", "payouts", "compliance"]) {
      const { container, unmount } = await renderDetail(tab);
      expect(findUntranslated(container, { ignore: ["Lakshmi Venkatesh", "The Green Bowl"] }), tab).toEqual([]);
      unmount();
    }
  });
});
