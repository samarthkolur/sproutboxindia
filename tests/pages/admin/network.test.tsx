import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

const { refresh, toast, getAdminHubs, getAdminHub, getAdminDeliveries } = vi.hoisted(() => ({
  refresh: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
  getAdminHubs: vi.fn(),
  getAdminHub: vi.fn(),
  getAdminDeliveries: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/lib/admin-data", () => ({
  getAdminHubs: (...a: unknown[]) => getAdminHubs(...a),
  getAdminHub: (...a: unknown[]) => getAdminHub(...a),
  getAdminDeliveries: (...a: unknown[]) => getAdminDeliveries(...a),
}));

import AdminHubsPage from "@/app/(dashboard)/admin/hubs/page";
import AdminHubDetailPage from "@/app/(dashboard)/admin/hubs/[hubId]/page";
import AdminDeliveriesPage from "@/app/(dashboard)/admin/deliveries/page";

const day = 86400000;
const ahead = (d: number) => new Date(Date.now() + d * day);

describe("admin hubs", () => {
  beforeEach(() => {
    getAdminHubs.mockReset().mockResolvedValue([
      { id: "h1", name: "Koramangala Hub", address: "5th Block, Koramangala", clusterName: "Koramangala Cluster", growers: 14, upcoming: 2, dropoffStart: "08:00", dropoffEnd: "11:00", isActive: true },
    ]);
  });

  it("shows each hub as a tile with its drop-off window, grower count and upcoming deliveries", async () => {
    render(await AdminHubsPage());
    const tile = screen.getByRole("link", { name: "Koramangala Hub" }).closest("li")!;
    expect(screen.getByRole("link", { name: "Koramangala Hub" })).toHaveAttribute("href", "/admin/hubs/h1");
    expect(tile).toHaveTextContent("08:00–11:00");
    expect(tile).toHaveTextContent("14");
    expect(tile).toHaveTextContent("2");
  });

  it("does not tell the admin to create a hub, since nothing can create one", async () => {
    getAdminHubs.mockResolvedValue([]);
    render(await AdminHubsPage());
    expect(screen.getByText("No hubs yet")).toBeInTheDocument();
    expect(screen.queryByText(/create/i)).not.toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", async () => {
    const { container } = render(await AdminHubsPage());
    expect(findUntranslated(container)).toEqual([]);
  });
});

describe("admin hub detail", () => {
  const hub = (over: Record<string, unknown> = {}) => ({
    id: "h1", name: "Koramangala Hub", address: "5th Block", dropoffStart: "08:00", dropoffEnd: "11:00", isActive: true,
    cluster: { name: "Koramangala Cluster", growers: [{ id: "g1", city: "Bengaluru", isActive: true, user: { name: "Lakshmi Venkatesh" } }] },
    deliveries: [{ id: "d1", status: "DELIVERED", order: { id: "cmorder0001abcdef", cropType: "sunflower", quantityKg: 3, deliveryDate: ahead(-3), restaurant: { businessName: "The Green Bowl" } } }],
    ...over,
  });
  const renderHub = async () => render(await AdminHubDetailPage({ params: { hubId: "h1" } }));

  beforeEach(() => getAdminHub.mockReset().mockResolvedValue(hub()));

  it("is a 404 for a hub that does not exist", async () => {
    getAdminHub.mockResolvedValue(null);
    await expect(renderHub()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("shows the deliveries through the hub and links each grower to their page", async () => {
    await renderHub();
    expect(within(screen.getByRole("table", { name: "Deliveries" })).getByText("The Green Bowl")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lakshmi Venkatesh" })).toHaveAttribute("href", "/admin/growers/g1");
  });

  it("shows no invented received-kilos meter", async () => {
    await renderHub();
    expect(screen.queryByText(/expected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/received/i)).not.toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", async () => {
    const { container } = await renderHub();
    expect(findUntranslated(container)).toEqual([]);
  });
});

describe("admin deliveries", () => {
  const delivery = (id: string, status: string, over: Record<string, unknown> = {}) => ({
    id, status, deliveredAt: status === "DELIVERED" ? ahead(-2) : null, hub: { name: "Koramangala Hub" },
    order: { id: `cmorder${id}abcdef`, cropType: "sunflower", quantityKg: 3, deliveryDate: ahead(2), restaurant: { businessName: "The Green Bowl" } }, ...over,
  });
  const data = (deliveries: unknown[], over: Record<string, unknown> = {}) => ({ deliveries, hasMore: false, counts: { PREPARING: 1, PACKED: 1, IN_TRANSIT: 1, DELIVERED: 1 }, ...over });
  const renderPage = async (searchParams: Record<string, string> = {}) => render(await AdminDeliveriesPage({ searchParams }));
  const table = () => screen.getByRole("table", { name: "Deliveries" });
  const fetchMock = vi.fn();

  beforeEach(() => {
    refresh.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal("fetch", fetchMock);
    getAdminDeliveries.mockReset().mockResolvedValue(data([delivery("0001", "PREPARING"), delivery("0002", "IN_TRANSIT"), delivery("0003", "DELIVERED")]));
  });

  it("counts every status on its chip", async () => {
    await renderPage();
    const chips = screen.getByRole("group", { name: "Filter deliveries" });
    expect(within(chips).getByRole("link", { name: /^All/ })).toHaveTextContent("4");
    expect(within(chips).getByRole("link", { name: /Packed/ })).toHaveTextContent("1");
    expect(within(chips).getByRole("link", { name: /Failed/ })).toHaveTextContent("0");
  });

  it("passes the status filter and page size to the query", async () => {
    await renderPage({ status: "IN_TRANSIT", limit: "40" });
    expect(getAdminDeliveries).toHaveBeenCalledWith("IN_TRANSIT", 40);
  });

  it("shows order, crop and kilos, the delivery date, hub and status", async () => {
    await renderPage();
    const row = within(table()).getAllByRole("row")[1];
    expect(row).toHaveTextContent("The Green Bowl");
    expect(row).toHaveTextContent("Sunflower Shoots, 3 kg");
    expect(row).toHaveTextContent("Koramangala Hub");
    expect(row).toHaveTextContent("Preparing");
  });

  it("flags a delivery that is late: the day has passed and it has not arrived", async () => {
    getAdminDeliveries.mockResolvedValue(data([delivery("0001", "IN_TRANSIT", { order: { id: "cmorder0001abcdef", cropType: "radish", quantityKg: 1, deliveryDate: ahead(-3), restaurant: { businessName: "The Green Bowl" } } })]));
    await renderPage();
    expect(within(table()).getByText("Late")).toBeInTheDocument();
  });

  it("does not flag a delivery that is on time", async () => {
    await renderPage();
    expect(within(table()).queryByText("Late")).not.toBeInTheDocument();
  });

  it("offers the next step on each row, and none once delivered", async () => {
    await renderPage();
    expect(within(table()).getByRole("button", { name: /Mark packed for The Green Bowl/ })).toBeInTheDocument();
    expect(within(table()).getByRole("button", { name: /Mark delivered for The Green Bowl/ })).toBeInTheDocument();
    expect(within(table()).getAllByRole("button")).toHaveLength(2);
  });

  it("advances a delivery through the API and refreshes", async () => {
    await renderPage();
    fireEvent.click(within(table()).getByRole("button", { name: /Mark delivered for/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/admin/delivery/0002", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "DELIVERED" }) })));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("Marked delivered");
  });

  it("shows the server's message when a step fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "Unauthorized" }) });
    await renderPage();
    fireEvent.click(within(table()).getByRole("button", { name: /Mark packed for/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Unauthorized"));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("loads more beyond the first twenty", async () => {
    getAdminDeliveries.mockResolvedValue(data([delivery("0001", "PACKED")], { hasMore: true }));
    await renderPage({ status: "PACKED" });
    expect(screen.getByRole("link", { name: "Load more" })).toHaveAttribute("href", "/admin/deliveries?status=PACKED&limit=40");
  });

  it("has an empty state before any delivery exists", async () => {
    getAdminDeliveries.mockResolvedValue(data([], { counts: {} }));
    await renderPage();
    expect(screen.getByText("No deliveries yet")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", async () => {
    const { container } = await renderPage();
    expect(findUntranslated(container, { ignore: ["The Green Bowl"] })).toEqual([]);
  });
});
