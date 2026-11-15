import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { daysFromNow, delivered, feedback, order } from "@/test/restaurant-fixtures";
import { findUntranslated } from "@/test/translation";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "user-1" } }) }));
const redirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (url: string) => redirect(url),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const getRestaurantOrder = vi.fn();
vi.mock("@/lib/restaurant-data", () => ({ getRestaurantOrder: (...a: unknown[]) => getRestaurantOrder(...a) }));

import RestaurantOrderDetailPage from "@/app/(dashboard)/restaurant/orders/[id]/page";
import OrderRedirect from "@/app/(dashboard)/restaurant/order/[orderId]/page";

const renderPage = async () => render(await RestaurantOrderDetailPage({ params: { id: "cmorder0001abcdef" } }));
const panel = (title: string) => screen.getByRole("heading", { name: title }).closest(".panel") as HTMLElement;

describe("restaurant order detail", () => {
  beforeEach(() => {
    getRestaurantOrder.mockReset();
    redirect.mockClear();
  });

  it("reads one order through the signed-in user", async () => {
    getRestaurantOrder.mockResolvedValue(order());
    await renderPage();
    expect(getRestaurantOrder).toHaveBeenCalledWith("user-1", "cmorder0001abcdef");
  });

  it("is a 404 for an order that is not theirs", async () => {
    getRestaurantOrder.mockResolvedValue(null);
    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("names the crop, not the raw crop id, and has a real breadcrumb", async () => {
    getRestaurantOrder.mockResolvedValue(order({ cropType: "pea-shoots" }));
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pea Shoots");
    expect(within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByRole("link", { name: "My orders" })).toHaveAttribute("href", "/restaurant/orders");
  });

  it("shows the five-step tracker even before a delivery record exists", async () => {
    getRestaurantOrder.mockResolvedValue(order());
    await renderPage();
    const steps = within(panel("Where your order is")).getAllByRole("listitem");
    expect(steps.map((s) => s.textContent?.replace(/^\d+/, "").slice(0, 12))).toEqual(["Confirmed You", "In productio", "At hub Harve", "In transit On", "Delivered De"].map((t) => expect.stringContaining(t.slice(0, 6))));
    expect(steps[1]).toHaveAttribute("aria-current", "step");
    expect(steps[0]).not.toHaveAttribute("aria-current");
  });

  it("shows the growth ring and the day count while it grows", async () => {
    getRestaurantOrder.mockResolvedValue(order());
    await renderPage();
    expect(screen.getByRole("img", { name: "33% grown" })).toBeInTheDocument();
    expect(screen.getByText("Day 3 of 9")).toBeInTheDocument();
  });

  it("waits on payment: a banner, Pay now, no invoice and no ring", async () => {
    getRestaurantOrder.mockResolvedValue(order({ status: "PENDING_PAYMENT" }));
    await renderPage();
    expect(screen.getByText("Waiting for payment")).toBeInTheDocument();
    expect(within(panel("Actions")).getByRole("button", { name: "Pay now" })).toBeInTheDocument();
    expect(within(panel("Actions")).queryByRole("link", { name: "Download invoice" })).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /grown/ })).not.toBeInTheDocument();
  });

  it("offers the invoice for a paid order, and feedback once it is delivered", async () => {
    getRestaurantOrder.mockResolvedValue(delivered({ id: "cmorder0001abcdef" }));
    await renderPage();
    const actions = panel("Actions");
    expect(within(actions).getByRole("link", { name: "Download invoice" })).toHaveAttribute("href", "/api/invoices/restaurant/cmorder0001abcdef");
    expect(within(actions).getByRole("link", { name: "Leave feedback" })).toHaveAttribute("href", "/restaurant/feedback/cmorder0001abcdef");
    expect(within(actions).queryByRole("button", { name: "Pay now" })).not.toBeInTheDocument();
  });

  it("completes every step on delivery", async () => {
    getRestaurantOrder.mockResolvedValue(delivered({ id: "cmorder0001abcdef" }));
    await renderPage();
    const steps = within(panel("Where your order is")).getAllByRole("listitem");
    for (const step of steps) expect(step).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("img", { name: "100% grown" })).toBeInTheDocument();
  });

  it("shows the rating already given, with its tags, and offers to edit it", async () => {
    getRestaurantOrder.mockResolvedValue(delivered({ id: "cmorder0001abcdef", feedback: feedback() }));
    await renderPage();
    const given = panel("Your feedback");
    expect(within(given).getByRole("img", { name: "Rated 4 of 5" })).toBeInTheDocument();
    expect(within(given).getByText("Quality")).toBeInTheDocument();
    expect(within(given).getByText("Very fresh")).toBeInTheDocument();
    expect(within(given).getByRole("link", { name: "Edit feedback" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Leave feedback" })).not.toBeInTheDocument();
  });

  it("shows the order's notes and repeat preference", async () => {
    getRestaurantOrder.mockResolvedValue(order({ notes: "Deliver to the back door", recurrence: "biweekly", deliveryDate: daysFromNow(3) }));
    await renderPage();
    expect(screen.getByText("Deliver to the back door")).toBeInTheDocument();
    expect(screen.getByText("Every 2 weeks")).toBeInTheDocument();
  });

  it("says a cancelled order was cancelled, with no tracker", async () => {
    getRestaurantOrder.mockResolvedValue(order({ status: "CANCELLED" }));
    await renderPage();
    expect(screen.getByText("This order was cancelled")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Where your order is" })).not.toBeInTheDocument();
  });

  it("has Kannada and Hindi for everything it says", async () => {
    getRestaurantOrder.mockResolvedValue(delivered({ id: "cmorder0001abcdef", notes: "x", feedback: feedback() }));
    const { container } = await renderPage();
    expect(findUntranslated(container, { ignore: ["x", "Very fresh"] })).toEqual([]);
  });
});

describe("the old /restaurant/order/[orderId] path", () => {
  it("sends anything still pointing at it to the real order page", () => {
    expect(() => OrderRedirect({ params: { orderId: "cmorder0001abcdef" } })).toThrow("NEXT_REDIRECT /restaurant/orders/cmorder0001abcdef");
  });

  it("does not let the id break out of the path", () => {
    expect(() => OrderRedirect({ params: { orderId: "../admin" } })).toThrow("NEXT_REDIRECT /restaurant/orders/..%2Fadmin");
  });
});
