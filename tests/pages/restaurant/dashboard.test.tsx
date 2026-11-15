import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { daysFromNow, delivered, feedback, order } from "@/test/restaurant-fixtures";
import { findUntranslated } from "@/test/translation";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "user-1" } }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const getRestaurantOrders = vi.fn();
vi.mock("@/lib/restaurant-data", () => ({ getRestaurantOrders: (...a: unknown[]) => getRestaurantOrders(...a) }));

import RestaurantDashboard from "@/app/(dashboard)/restaurant/dashboard/page";

const home = (orders: unknown[]) => getRestaurantOrders.mockResolvedValue({ businessName: "The Green Bowl", orders });
const renderPage = async () => render(await RestaurantDashboard());

describe("restaurant dashboard", () => {
  beforeEach(() => getRestaurantOrders.mockReset());

  it("scopes the read to the signed-in user", async () => {
    home([]);
    await renderPage();
    expect(getRestaurantOrders).toHaveBeenCalledWith("user-1");
  });

  it("says in one sentence what is going on", async () => {
    home([order(), order({ id: "cmorder0002zzzzzz", status: "CONFIRMED" })]);
    await renderPage();
    expect(screen.getByText(/2 orders are on their way\. Next delivery/)).toBeInTheDocument();
  });

  it("offers one New order button in the header, not two", async () => {
    home([]);
    await renderPage();
    expect(screen.getAllByRole("link", { name: /New order/ })).toHaveLength(1);
  });

  it("totals every order, not just the latest five", async () => {
    home(Array.from({ length: 8 }, (_, i) => order({ id: `cmorder${i}00000000`, status: "DELIVERED" })));
    await renderPage();
    const tile = screen.getByText("Total orders").closest("a")!;
    expect(tile).toHaveTextContent("8");
    expect(tile).toHaveTextContent("8 delivered");
  });

  it("shows a real month-over-month change, or no percentage instead of an invented one", async () => {
    const last = new Date(NOW_YEAR, NOW_MONTH - 1, 10);
    home([order({ createdAt: new Date() }), order({ id: "cmorder0003zzzzzz", createdAt: last, status: "DELIVERED" })]);
    const first = await renderPage();
    expect(screen.getByText("This month").closest("div")!.parentElement).toHaveTextContent("₹1,350");
    expect(screen.getByText(/% vs last month/)).toBeInTheDocument();
    first.unmount();
    home([order({ createdAt: new Date() })]);
    await renderPage();
    expect(screen.queryByText(/vs last month/)).not.toBeInTheDocument();
    expect(screen.queryByText("+12%")).not.toBeInTheDocument();
  });

  it("shows the average of the ratings given", async () => {
    home([delivered({ feedback: feedback({ rating: 5 }) }), delivered({ id: "cmdelivered02abcd", feedback: feedback({ id: "fb2", rating: 4 }) })]);
    await renderPage();
    const tile = screen.getByText("Average rating").closest("div")!.parentElement!;
    expect(tile).toHaveTextContent("4.5");
    expect(tile).toHaveTextContent("From 2 ratings");
  });

  it("puts a pay-now banner above everything when an order is unpaid", async () => {
    home([order({ status: "PENDING_PAYMENT" })]);
    await renderPage();
    const banner = screen.getByRole("status");
    expect(banner).toHaveTextContent("₹1,350 is waiting to be paid");
    expect(within(banner).getByRole("button", { name: "Pay now" })).toBeInTheDocument();
    expect(screen.getByText("1 order is waiting for payment.")).toBeInTheDocument();
  });

  it("links to the orders page to pay several at once", async () => {
    home([order({ status: "PENDING_PAYMENT" }), order({ id: "cmorder0004zzzzzz", status: "PENDING_PAYMENT" })]);
    await renderPage();
    expect(within(screen.getByRole("status")).getByRole("link", { name: /Review and pay/ })).toHaveAttribute("href", "/restaurant/orders?status=awaiting");
  });

  it("shows each order in progress as a link with a growth ring from its trays", async () => {
    home([order()]);
    await renderPage();
    expect(screen.getByRole("link", { name: "Sunflower Shoots" })).toHaveAttribute("href", "/restaurant/orders/cmorder0001abcdef");
    expect(screen.getByRole("img", { name: "33% grown" })).toBeInTheDocument();
  });

  it("shows the next delivery as a hero card", async () => {
    home([order({ deliveryDate: daysFromNow(2) })]);
    await renderPage();
    const hero = screen.getByRole("region", { name: "Next delivery" });
    expect(within(hero).getByText("Sunflower Shoots, 3 kg")).toBeInTheDocument();
    expect(within(hero).getByRole("link", { name: /View order/ })).toHaveAttribute("href", "/restaurant/orders/cmorder0001abcdef");
  });

  it("turns each crop card into a link that preselects the crop", async () => {
    home([]);
    await renderPage();
    const catalog = screen.getByRole("heading", { name: "Order a crop" }).closest("section")!;
    expect(within(catalog).getByRole("link", { name: /Radish/ })).toHaveAttribute("href", "/restaurant/order/new?crop=radish");
    expect(within(catalog).getAllByRole("link")).toHaveLength(6);
  });

  it("handles a signed-in user with no restaurant profile", async () => {
    getRestaurantOrders.mockResolvedValue(null);
    await renderPage();
    expect(screen.getByText("No restaurant profile found")).toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", async () => {
    home([order(), order({ id: "cmorder0005zzzzzz", status: "PENDING_PAYMENT" }), delivered({ feedback: feedback() })]);
    const { container } = await renderPage();
    expect(findUntranslated(container)).toEqual([]);
  });
});

const NOW_YEAR = new Date().getFullYear();
const NOW_MONTH = new Date().getMonth();
