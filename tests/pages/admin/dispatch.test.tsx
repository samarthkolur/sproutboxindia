import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

const { refresh, toast, actions } = vi.hoisted(() => ({
  refresh: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  actions: { markGrowerSuppliesDelivered: vi.fn(), markSeedsDelivered: vi.fn(), undoSuppliesDelivered: vi.fn() },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/actions/dispatch.actions", () => actions);

import { DispatchClient, type DispatchGroup } from "@/app/(dashboard)/admin/dispatch/DispatchClient";

const hours = (h: number) => new Date(Date.now() - h * 3600 * 1000);
const groups: DispatchGroup[] = [
  {
    growerId: "g1", name: "Lakshmi Venkatesh", city: "Bengaluru",
    tasks: [
      { id: "t1", cropType: "sunflower", trayCount: 8, allocatedAt: hours(50), restaurant: "The Green Bowl" },
      { id: "t2", cropType: "radish", trayCount: 4, allocatedAt: hours(5), restaurant: "Fresh Fare Kitchen" },
    ],
  },
  { growerId: "g2", name: "Suresh Gowda", city: "Mysuru", tasks: [{ id: "t3", cropType: "mustard", trayCount: 6, allocatedAt: hours(1), restaurant: "The Green Bowl" }] },
];

describe("admin dispatch", () => {
  beforeEach(() => {
    refresh.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    actions.markGrowerSuppliesDelivered.mockReset().mockResolvedValue({ count: 2 });
    actions.markSeedsDelivered.mockReset().mockResolvedValue({ success: true });
    actions.undoSuppliesDelivered.mockReset().mockResolvedValue({ count: 2 });
  });

  it("groups tasks by grower with a waiting-time chip, tray totals and the city", () => {
    render(<DispatchClient groups={groups} />);
    const lakshmi = screen.getByText("Lakshmi Venkatesh").closest("li")!;
    expect(lakshmi).toHaveTextContent("Bengaluru");
    expect(lakshmi).toHaveTextContent("2 tasks · 12 trays");
    expect(lakshmi).toHaveTextContent("Allocated 2 days ago");
    expect(screen.getByText("Suresh Gowda").closest("li")).toHaveTextContent("1 task · 6 trays");
  });

  it("names the action 'Mark seeds delivered', not 'dispatch'", () => {
    render(<DispatchClient groups={groups} />);
    expect(screen.getAllByRole("button", { name: "Mark seeds delivered" })).toHaveLength(3);
    expect(screen.queryByText(/Dispatch Tasks/i)).not.toBeInTheDocument();
  });

  it("marks one task delivered and removes it", async () => {
    render(<DispatchClient groups={groups} />);
    const row = screen.getByText(/Radish, 4 trays/).closest("li")!;
    fireEvent.click(within(row).getByRole("button", { name: "Mark seeds delivered" }));
    await waitFor(() => expect(actions.markSeedsDelivered).toHaveBeenCalledWith("t2"));
    await waitFor(() => expect(screen.queryByText(/Radish, 4 trays/)).not.toBeInTheDocument());
    expect(screen.getByText(/Sunflower Shoots, 8 trays/)).toBeInTheDocument();
  });

  it("marks everything one grower is owed in one click, with a single notification", async () => {
    render(<DispatchClient groups={groups} />);
    fireEvent.click(screen.getByRole("button", { name: "Mark all delivered" }));
    await waitFor(() => expect(actions.markGrowerSuppliesDelivered).toHaveBeenCalledWith("g1"));
    expect(actions.markSeedsDelivered).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText("Lakshmi Venkatesh")).not.toBeInTheDocument());
    expect(toast.success).toHaveBeenCalledWith("2 tasks marked delivered", expect.objectContaining({ description: "Lakshmi Venkatesh has been told.", action: expect.objectContaining({ label: "Undo" }) }));
  });

  it("offers no 'Mark all' for a grower with a single task", () => {
    render(<DispatchClient groups={[groups[1]]} />);
    expect(screen.queryByRole("button", { name: "Mark all delivered" })).not.toBeInTheDocument();
  });

  it("undoes a delivery from the toast, bringing the tasks back", async () => {
    render(<DispatchClient groups={groups} />);
    fireEvent.click(screen.getByRole("button", { name: "Mark all delivered" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    await toast.success.mock.calls[0][1].action.onClick();
    expect(actions.undoSuppliesDelivered).toHaveBeenCalledWith(["t1", "t2"]);
    expect(await screen.findByText("Lakshmi Venkatesh")).toBeInTheDocument();
  });

  it("says when it is too late to undo", async () => {
    actions.undoSuppliesDelivered.mockResolvedValue({ count: 0 });
    render(<DispatchClient groups={groups} />);
    fireEvent.click(screen.getByRole("button", { name: "Mark all delivered" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    await toast.success.mock.calls[0][1].action.onClick();
    expect(toast.error).toHaveBeenCalledWith("This can no longer be undone", { description: "The grower has already started." });
    expect(screen.queryByText("Lakshmi Venkatesh")).not.toBeInTheDocument();
  });

  it("keeps the task and shows why when the action fails", async () => {
    actions.markGrowerSuppliesDelivered.mockRejectedValue(new Error("Unauthorized"));
    render(<DispatchClient groups={groups} />);
    fireEvent.click(within(screen.getByText(/Mustard, 6 trays/).closest("li")!).getByRole("button", { name: "Mark seeds delivered" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Could not mark delivered", { description: "Unauthorized" }));
    expect(screen.getByText(/Mustard, 6 trays/)).toBeInTheDocument();
  });

  it("has an empty state", () => {
    render(<DispatchClient groups={[]} />);
    expect(screen.getByText("No supplies waiting")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { container } = render(<DispatchClient groups={groups} />);
    expect(findUntranslated(container, { ignore: ["Lakshmi Venkatesh", "Suresh Gowda", "Bengaluru", "Mysuru"] })).toEqual([]);
  });
});
