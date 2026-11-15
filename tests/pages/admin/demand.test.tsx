import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

const { createProductionPlans, toast } = vi.hoisted(() => ({
  createProductionPlans: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("@/actions/demand.actions", () => ({ createProductionPlans: (...a: unknown[]) => createProductionPlans(...a) }));
vi.mock("sonner", () => ({ toast }));

import { DemandClient, type DemandOrder } from "@/app/(dashboard)/admin/demand/DemandClient";

const day = 86400000;
const order = (id: string, crop: string, kg: number, daysAway: number, name = "The Green Bowl"): DemandOrder => ({
  id,
  cropType: crop,
  quantityKg: kg,
  deliveryDate: new Date(Date.now() + daysAway * day),
  restaurant: { businessName: name },
});

const orders = [order("cmlate000001abcdef", "radish", 2, 20), order("cmsoon000001abcdef", "sunflower", 3, 5, "Fresh Fare Kitchen"), order("cmmid0000001abcdef", "sunflower", 1, 12)];
const preview = () => screen.getByRole("heading", { name: "Plan preview" }).closest(".panel") as HTMLElement;

describe("admin demand", () => {
  beforeEach(() => {
    createProductionPlans.mockReset().mockResolvedValue({ created: 1, failed: [] });
    toast.error.mockReset();
  });

  it("lists orders with the nearest delivery first, tagged by urgency", () => {
    render(<DemandClient orders={orders} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Fresh Fare Kitchen");
    expect(rows[0]).toHaveTextContent("Delivery in 5 days");
    expect(rows[2]).toHaveTextContent("The Green Bowl");
    expect(rows[2]).toHaveTextContent("Delivery in 20 days");
  });

  it("previews the tray calculation for the most urgent order", () => {
    render(<DemandClient orders={orders} />);
    expect(within(preview()).getByText("Sunflower Shoots, 3 kg")).toBeInTheDocument();
    expect(within(preview()).getByText("Base trays").nextSibling).toHaveTextContent("15");
    expect(within(preview()).getByText("Buffer 25%").nextSibling).toHaveTextContent("+4");
    expect(within(preview()).getByText("Total trays").nextSibling).toHaveTextContent("19");
    expect(within(preview()).getByText("Grow cycle").nextSibling).toHaveTextContent("9 days");
  });

  it("switches the preview to the order that is clicked", () => {
    render(<DemandClient orders={orders} />);
    fireEvent.click(screen.getByRole("button", { name: /The Green Bowl.*Radish/ }));
    expect(within(preview()).getByText("Radish, 2 kg")).toBeInTheDocument();
    expect(within(preview()).getByText("Total trays").nextSibling).toHaveTextContent("13");
  });

  it("filters by crop with counts", () => {
    render(<DemandClient orders={orders} />);
    const chips = screen.getByRole("group", { name: "Filter by crop" });
    expect(within(chips).getByRole("button", { name: /Sunflower Shoots/ })).toHaveTextContent("2");
    fireEvent.click(within(chips).getByRole("button", { name: /Radish/ }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("creates one plan from the preview and removes the order", async () => {
    render(<DemandClient orders={orders} />);
    fireEvent.click(within(preview()).getByRole("button", { name: "Create production plan" }));
    await waitFor(() => expect(createProductionPlans).toHaveBeenCalledWith(["cmsoon000001abcdef"]));
    expect(await screen.findByText("1 production plan created")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Allocate now" })).toHaveAttribute("href", "/admin/allocate");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("creates several plans at once from a multi-select", async () => {
    createProductionPlans.mockResolvedValue({ created: 2, failed: [] });
    render(<DemandClient orders={orders} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select order CMSOON00" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select order CMLATE00" }));
    fireEvent.click(screen.getByRole("button", { name: "Create plans (2)" }));
    await waitFor(() => expect(createProductionPlans).toHaveBeenCalledWith(["cmsoon000001abcdef", "cmlate000001abcdef"]));
    expect(await screen.findByText("2 production plans created")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("keeps an order whose plan could not be created, and says why", async () => {
    createProductionPlans.mockResolvedValue({ created: 1, failed: [{ orderId: "cmlate000001abcdef", error: "Order must be CONFIRMED to create a production plan" }] });
    render(<DemandClient orders={orders} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select order CMSOON00" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select order CMLATE00" }));
    fireEvent.click(screen.getByRole("button", { name: "Create plans (2)" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("1 could not be planned", { description: "Order must be CONFIRMED to create a production plan" }));
    expect(screen.getByText(/Delivery in 20 days/)).toBeInTheDocument();
  });

  it("shows an error from the server instead of pretending it worked", async () => {
    createProductionPlans.mockResolvedValue({ error: "Unauthorized", created: 0, failed: [] });
    render(<DemandClient orders={orders} />);
    fireEvent.click(within(preview()).getByRole("button", { name: "Create production plan" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Unauthorized"));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("flags an order whose delivery date has passed", () => {
    render(<DemandClient orders={[order("cmold0000001abcdef", "radish", 1, -3)]} />);
    expect(screen.getByText("3 days overdue")).toBeInTheDocument();
  });

  it("has an empty state", () => {
    render(<DemandClient orders={[]} />);
    expect(screen.getByText("No orders waiting for a plan")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { container } = render(<DemandClient orders={orders} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select order CMSOON00" }));
    expect(findUntranslated(container, { ignore: ["The Green Bowl", "Fresh Fare Kitchen"] })).toEqual([]);
  });
});
