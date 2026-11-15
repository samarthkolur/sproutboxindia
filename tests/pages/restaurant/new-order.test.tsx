import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { addDays } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toDateInputValue } from "@/lib/restaurant";
import { findUntranslated } from "@/test/translation";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
const trackPurchase = vi.fn();
vi.mock("@/lib/gtag", () => ({ trackPurchase: (...a: unknown[]) => trackPurchase(...a) }));
vi.mock("@/components/restaurant/CheckoutModal", () => ({
  CheckoutModal: ({ payments, onComplete, onCancel }: { payments: { label: string }[]; onComplete: () => void; onCancel: () => void }) => (
    <div role="dialog" aria-label="Checkout">
      <p>{payments.map((p) => p.label).join(" + ")}</p>
      <button onClick={onComplete}>finish payment</button>
      <button onClick={onCancel}>pay later</button>
    </div>
  ),
}));

import NewOrderPage from "@/app/(dashboard)/restaurant/order/new/page";
import { NewOrderClient } from "@/app/(dashboard)/restaurant/order/new/NewOrderClient";

const fetchMock = vi.fn();
const created = (id: string, secret: string | null = null, price = 450) => ({ ok: true, json: async () => ({ data: { order: { id, totalPrice: price }, clientSecret: secret } }) });
const failed = { ok: false, json: async () => ({ error: "nope" }) };

const renderClient = (props: Partial<{ initialCart: { cropType: "sunflower" | "radish" | "wheatgrass"; quantityKg: number }[]; initialRecurrence: "weekly" | "biweekly" | null }> = {}) =>
  render(<NewOrderClient initialCart={props.initialCart ?? []} initialRecurrence={props.initialRecurrence ?? null} />);

const cart = () => screen.getByRole("heading", { name: "Your order" }).closest(".panel") as HTMLElement;
const futureDate = (days: number) => toDateInputValue(addDays(new Date(), days));
const chooseDate = (value: string) => fireEvent.change(within(cart()).getByLabelText("Delivery date"), { target: { value } });
const bodies = () => fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body));

describe("new order", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    trackPurchase.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("starts empty, and shows grow time for every crop from the crop table", () => {
    renderClient();
    expect(within(cart()).getByText("Your order is empty")).toBeInTheDocument();
    expect(screen.getByText("9 days to grow")).toBeInTheDocument(); // sunflower
    expect(screen.getByText("10 days to grow")).toBeInTheDocument(); // wheatgrass
    expect(screen.getAllByText(/days to grow/)).toHaveLength(6);
  });

  it("adds a crop, steps its quantity by half a kilo, and totals the price", () => {
    renderClient();
    fireEvent.click(screen.getByRole("button", { name: "Add Sunflower Shoots" }));
    expect(within(cart()).getByText("1 kg × ₹450")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add half a kilo of Sunflower Shoots" }));
    expect(within(cart()).getByText("1.5 kg × ₹450")).toBeInTheDocument();
    expect(within(cart()).getByText("₹675", { selector: "span.text-2xl" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove half a kilo of Sunflower Shoots" }));
    expect(within(cart()).getByText("1 kg × ₹450")).toBeInTheDocument();
  });

  it("removing the last half kilo, or the trash button, empties the line", () => {
    renderClient({ initialCart: [{ cropType: "radish", quantityKg: 0.5 }] });
    fireEvent.click(screen.getByRole("button", { name: "Remove half a kilo of Radish" }));
    expect(within(cart()).getByText("Your order is empty")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add Radish" }));
    fireEvent.click(within(cart()).getByRole("button", { name: "Remove Radish" }));
    expect(within(cart()).getByText("Your order is empty")).toBeInTheDocument();
  });

  it("opens with a preselected crop", () => {
    renderClient({ initialCart: [{ cropType: "radish", quantityKg: 2 }] });
    expect(within(cart()).getByText("2 kg × ₹320")).toBeInTheDocument();
  });

  it("is preselected from the page's query: a valid crop and cadence, nothing else", async () => {
    const ok = render(<NewOrderPage searchParams={{ crop: "radish", kg: "2.5", recurrence: "weekly" }} />);
    expect(within(cart()).getByText("2.5 kg × ₹320")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Weekly" })).toBeChecked();
    ok.unmount();
    render(<NewOrderPage searchParams={{ crop: "kale", kg: "-4", recurrence: "daily" }} />);
    expect(within(cart()).getByText("Your order is empty")).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Weekly" })).not.toBeInTheDocument();
  });

  it("sets the earliest delivery from the slowest crop in the cart", () => {
    renderClient({ initialCart: [{ cropType: "radish", quantityKg: 1 }] });
    const input = within(cart()).getByLabelText("Delivery date");
    expect(input).toHaveAttribute("min", futureDate(9)); // 7-day radish + 2
    fireEvent.click(screen.getByRole("button", { name: "Add Wheat Grass" }));
    expect(input).toHaveAttribute("min", futureDate(12)); // 10-day wheatgrass + 2
  });

  it("asks for a date, and refuses one that is too early, before sending anything", () => {
    renderClient({ initialCart: [{ cropType: "sunflower", quantityKg: 1 }] });
    fireEvent.click(within(cart()).getByRole("button", { name: "Place order" }));
    expect(within(cart()).getByText("Choose a delivery date.")).toBeInTheDocument();
    chooseDate(futureDate(3));
    fireEvent.click(within(cart()).getByRole("button", { name: "Place order" }));
    expect(within(cart()).getByText(/The earliest delivery for this order is/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("will not place an empty order", () => {
    renderClient({ initialCart: [{ cropType: "sunflower", quantityKg: 1 }] });
    fireEvent.click(within(cart()).getByRole("button", { name: "Remove Sunflower Shoots" }));
    expect(within(cart()).queryByRole("button", { name: "Place order" })).not.toBeInTheDocument();
  });

  it("sends one order per crop with the date, repeat preference and notes", async () => {
    fetchMock.mockResolvedValue(created("o1"));
    renderClient({ initialCart: [{ cropType: "sunflower", quantityKg: 1 }, { cropType: "radish", quantityKg: 2 }] });
    chooseDate(futureDate(14));
    fireEvent.click(within(cart()).getByRole("radio", { name: "Weekly" }));
    fireEvent.change(within(cart()).getByLabelText(/Notes/), { target: { value: "Back door, please" } });
    fireEvent.click(within(cart()).getByRole("button", { name: "Place order" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(bodies().map((b) => [b.cropType, b.quantityKg, b.recurrence, b.notes])).toEqual([
      ["sunflower", 1, "weekly", "Back door, please"],
      ["radish", 2, "weekly", "Back door, please"],
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/restaurant/order");
    expect(new Date(bodies()[0].deliveryDate).getDate()).toBe(addDays(new Date(), 14).getDate());
  });

  it("sends no repeat for a one-time order", async () => {
    fetchMock.mockResolvedValue(created("o1"));
    renderClient({ initialCart: [{ cropType: "sunflower", quantityKg: 1 }] });
    chooseDate(futureDate(14));
    fireEvent.click(within(cart()).getByRole("button", { name: "Place order" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(bodies()[0].recurrence).toBeNull();
  });

  it("says plainly that repeats are not automatic when a cadence is chosen", () => {
    renderClient({ initialCart: [{ cropType: "sunflower", quantityKg: 1 }], initialRecurrence: "biweekly" });
    expect(within(cart()).getByText(/Repeat orders are not placed for you yet/)).toBeInTheDocument();
  });

  it("goes to Orders and records the purchase when no payment is needed", async () => {
    fetchMock.mockResolvedValue(created("o1", null, 450));
    renderClient({ initialCart: [{ cropType: "sunflower", quantityKg: 1 }] });
    chooseDate(futureDate(14));
    fireEvent.click(within(cart()).getByRole("button", { name: "Place order" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/restaurant/orders"));
    expect(trackPurchase).toHaveBeenCalledWith({ transactionId: "o1", value: 450, cropType: "sunflower", quantityKg: 1 });
  });

  it("opens checkout for orders that are held until paid, and records the purchase only once paid", async () => {
    fetchMock.mockResolvedValueOnce(created("o1", "secret_1", 450)).mockResolvedValueOnce(created("o2", "secret_2", 640));
    renderClient({ initialCart: [{ cropType: "sunflower", quantityKg: 1 }, { cropType: "radish", quantityKg: 2 }] });
    chooseDate(futureDate(14));
    fireEvent.click(within(cart()).getByRole("button", { name: "Place order" }));
    const dialog = await screen.findByRole("dialog", { name: "Checkout" });
    expect(dialog).toHaveTextContent("Sunflower Shoots, 1 kg + Radish, 2 kg");
    expect(trackPurchase).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "finish payment" }));
    expect(trackPurchase).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/restaurant/orders"));
  });

  it("leaves unpaid orders awaiting payment if checkout is closed, without recording a purchase", async () => {
    fetchMock.mockResolvedValue(created("o1", "secret_1"));
    renderClient({ initialCart: [{ cropType: "sunflower", quantityKg: 1 }] });
    chooseDate(futureDate(14));
    fireEvent.click(within(cart()).getByRole("button", { name: "Place order" }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "pay later" }));
    expect(trackPurchase).not.toHaveBeenCalled();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/restaurant/orders"));
  });

  it("keeps only the failed line after a partial failure, so a retry cannot place the others twice", async () => {
    fetchMock.mockResolvedValueOnce(created("o1")).mockResolvedValueOnce(failed);
    renderClient({ initialCart: [{ cropType: "sunflower", quantityKg: 1 }, { cropType: "radish", quantityKg: 2 }] });
    chooseDate(futureDate(14));
    fireEvent.click(within(cart()).getByRole("button", { name: "Place order" }));
    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent("1 order was placed, but not everything went through");
    expect(banner).toHaveTextContent("Still in your cart: Radish");
    expect(within(banner).getByRole("link", { name: "See the orders already placed" })).toHaveAttribute("href", "/restaurant/orders");
    expect(push).not.toHaveBeenCalled();
    expect(within(cart()).queryByText("Sunflower Shoots")).not.toBeInTheDocument();
    expect(within(cart()).getByText("Radish")).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(created("o2"));
    fireEvent.click(within(cart()).getByRole("button", { name: "Place order" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(bodies()[2].cropType).toBe("radish");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/restaurant/orders"));
  });

  it("keeps the cart and explains when nothing could be placed", async () => {
    fetchMock.mockResolvedValue(failed);
    renderClient({ initialCart: [{ cropType: "sunflower", quantityKg: 1 }] });
    chooseDate(futureDate(14));
    fireEvent.click(within(cart()).getByRole("button", { name: "Place order" }));
    expect(await within(cart()).findByText(/We could not place your order/)).toBeInTheDocument();
    expect(within(cart()).getByText("Sunflower Shoots")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { container } = renderClient({ initialCart: [{ cropType: "sunflower", quantityKg: 1.5 }], initialRecurrence: "weekly" });
    expect(findUntranslated(container)).toEqual([]);
  });
});
