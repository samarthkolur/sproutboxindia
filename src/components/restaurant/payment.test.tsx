import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { findUntranslated } from "@/test/translation";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("sonner", () => ({ toast }));
const trackPurchase = vi.fn();
vi.mock("@/lib/gtag", () => ({ trackPurchase: (...a: unknown[]) => trackPurchase(...a) }));

const getStripeClient = vi.fn();
vi.mock("@/lib/stripe-client", () => ({ getStripeClient: () => getStripeClient() }));
const confirmPayment = vi.fn();
vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="elements">{children}</div>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => ({ confirmPayment }),
  useElements: () => ({}),
}));

import { CheckoutModal, stripeAppearance, type PendingPayment } from "./CheckoutModal";
import { PayNowButton } from "./PayNowButton";

const payment = (id: string, amount = 450): PendingPayment => ({ orderId: id, clientSecret: `secret_${id}`, label: `Sunflower Shoots, 1 kg`, amount, cropType: "sunflower", quantityKg: 1 });
const fetchMock = vi.fn();

beforeEach(() => {
  refresh.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
  trackPurchase.mockReset();
  confirmPayment.mockReset().mockResolvedValue({});
  getStripeClient.mockReset().mockReturnValue(Promise.resolve({}));
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("CheckoutModal", () => {
  it("shows the amount to pay and what it is for", () => {
    render(<CheckoutModal payments={[payment("o1", 1350)]} onComplete={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "Complete payment" })).toBeInTheDocument();
    expect(screen.getByText("Sunflower Shoots, 1 kg")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pay ₹1,350" })).toBeInTheDocument();
    expect(screen.getByTestId("payment-element")).toBeInTheDocument();
  });

  it("goes through several orders in turn, finishing after the last", async () => {
    const onComplete = vi.fn();
    render(<CheckoutModal payments={[payment("o1"), payment("o2", 640)]} onComplete={onComplete} onCancel={vi.fn()} />);
    expect(screen.getByText("Payment 1 of 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pay ₹450" }));
    expect(await screen.findByText("Payment 2 of 2")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Pay ₹640" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it("shows the card error and does not move on", async () => {
    confirmPayment.mockResolvedValue({ error: { message: "Your card was declined." } });
    const onComplete = vi.fn();
    render(<CheckoutModal payments={[payment("o1")]} onComplete={onComplete} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Pay ₹450" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your card was declined.");
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("can be closed to pay later from the Orders page", () => {
    const onCancel = vi.fn();
    render(<CheckoutModal payments={[payment("o1")]} onComplete={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "Pay later from the Orders page" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("says so when online payment is not set up, instead of showing nothing", () => {
    getStripeClient.mockReturnValue(null);
    render(<CheckoutModal payments={[payment("o1")]} onComplete={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/Online payment is not set up yet/)).toBeInTheDocument();
    expect(screen.queryByTestId("payment-element")).not.toBeInTheDocument();
  });

  it("hands Stripe the page's own colours from the CSS tokens", () => {
    document.documentElement.style.setProperty("--c-brand", "43 54 42");
    expect(stripeAppearance().variables?.colorPrimary).toBe("rgb(43,54,42)");
    document.documentElement.style.removeProperty("--c-brand");
    expect(stripeAppearance().variables?.colorPrimary).toBe("#2b362a");
  });

  it("has Kannada and Hindi for everything it says", () => {
    const { baseElement } = render(<CheckoutModal payments={[payment("o1"), payment("o2")]} onComplete={vi.fn()} onCancel={vi.fn()} />);
    expect(findUntranslated(baseElement, { ignore: [] })).toEqual([]);
  });
});

describe("PayNowButton", () => {
  const button = () => render(<PayNowButton orderId="o1" amount={450} cropType="sunflower" quantityKg={1} label="Sunflower Shoots, 1 kg" />);

  it("asks the server for the order's existing payment, then opens checkout", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: { alreadyPaid: false, clientSecret: "secret_o1", amount: 450 } }) });
    button();
    fireEvent.click(screen.getByRole("button", { name: "Pay now" }));
    const dialog = await screen.findByRole("dialog", { name: "Complete payment" });
    expect(fetchMock).toHaveBeenCalledWith("/api/restaurant/orders/o1/payment");
    expect(within(dialog).getByRole("button", { name: "Pay ₹450" })).toBeInTheDocument();
  });

  it("records the purchase and refreshes only after payment succeeds", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: { alreadyPaid: false, clientSecret: "secret_o1", amount: 450 } }) });
    button();
    fireEvent.click(screen.getByRole("button", { name: "Pay now" }));
    fireEvent.click(await screen.findByRole("button", { name: "Pay ₹450" }));
    await waitFor(() => expect(trackPurchase).toHaveBeenCalledWith({ transactionId: "o1", value: 450, cropType: "sunflower", quantityKg: 1 }));
    expect(refresh).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("does not record a purchase when the dialog is closed unpaid", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: { alreadyPaid: false, clientSecret: "secret_o1", amount: 450 } }) });
    button();
    fireEvent.click(screen.getByRole("button", { name: "Pay now" }));
    fireEvent.click(await screen.findByRole("button", { name: "Pay later from the Orders page" }));
    expect(trackPurchase).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("does not charge twice for an order that is already paid", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ data: { alreadyPaid: true, clientSecret: null, amount: 450 } }) });
    button();
    fireEvent.click(screen.getByRole("button", { name: "Pay now" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("tells the restaurant when the payment cannot be started", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "This payment can no longer be completed. Place the order again." }) });
    button();
    fireEvent.click(screen.getByRole("button", { name: "Pay now" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("This payment can no longer be completed. Place the order again."));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
