// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const findFirst = vi.fn();
const retrieve = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => auth() }));
vi.mock("@/lib/prisma", () => ({ prisma: { order: { findFirst: (a: unknown) => findFirst(a) } } }));
const stripeMock = { paymentIntents: { retrieve: (id: string) => retrieve(id) } };
let stripeEnabled = true;
vi.mock("@/lib/stripe", () => ({
  get stripe() {
    return stripeEnabled ? stripeMock : null;
  },
}));

import { GET } from "@/app/api/restaurant/orders/[id]/payment/route";

const call = () => GET(new Request("http://localhost/x"), { params: { id: "order-1" } });
const pendingOrder = { id: "order-1", status: "PENDING_PAYMENT", totalPrice: 450, stripePaymentId: "pi_1" };

describe("GET /api/restaurant/orders/[id]/payment", () => {
  beforeEach(() => {
    stripeEnabled = true;
    auth.mockReset().mockResolvedValue({ user: { id: "user-1", role: "RESTAURANT" } });
    findFirst.mockReset().mockResolvedValue(pendingOrder);
    retrieve.mockReset().mockResolvedValue({ status: "requires_payment_method", client_secret: "secret_1" });
  });

  it("is for signed-in restaurants only", async () => {
    auth.mockResolvedValue({ user: { id: "u", role: "GROWER" } });
    expect((await call()).status).toBe(401);
    auth.mockResolvedValue(null);
    expect((await call()).status).toBe(401);
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("looks the order up for this restaurant only", async () => {
    await call();
    expect(findFirst.mock.calls[0][0].where).toEqual({ id: "order-1", restaurant: { userId: "user-1" } });
  });

  it("is a 404 for someone else's order, without touching Stripe", async () => {
    findFirst.mockResolvedValue(null);
    expect((await call()).status).toBe(404);
    expect(retrieve).not.toHaveBeenCalled();
  });

  it("returns the existing PaymentIntent's client secret", async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, data: { alreadyPaid: false, clientSecret: "secret_1", amount: 450 } });
    expect(retrieve).toHaveBeenCalledWith("pi_1");
  });

  it("refuses an order that is not waiting for payment", async () => {
    findFirst.mockResolvedValue({ ...pendingOrder, status: "CONFIRMED" });
    const res = await call();
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("NOT_PAYABLE");
  });

  it("says so when online payment is not configured or the order has no intent", async () => {
    stripeEnabled = false;
    expect((await call()).status).toBe(409);
    stripeEnabled = true;
    findFirst.mockResolvedValue({ ...pendingOrder, stripePaymentId: null });
    expect((await call()).status).toBe(409);
  });

  it("reports an intent that already succeeded instead of charging twice", async () => {
    retrieve.mockResolvedValue({ status: "succeeded", client_secret: "secret_1" });
    const body = await (await call()).json();
    expect(body.data).toEqual({ alreadyPaid: true, clientSecret: null, amount: 450 });
  });

  it("refuses a cancelled intent", async () => {
    retrieve.mockResolvedValue({ status: "canceled", client_secret: "secret_1" });
    const res = await call();
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("PAYMENT_CLOSED");
  });
});
