import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// "Pay now" for an order that was placed but not paid. The PaymentIntent was created with
// the order; this hands its client secret back so the checkout can finish the payment.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "RESTAURANT") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const order = await prisma.order.findFirst({
      where: { id: params.id, restaurant: { userId: session.user.id } },
      select: { id: true, status: true, totalPrice: true, stripePaymentId: true },
    });
    if (!order) return fail("Order not found", "NOT_FOUND", 404);

    if (order.status !== "PENDING_PAYMENT") {
      return fail("This order is not waiting for payment", "NOT_PAYABLE", 409);
    }
    if (!stripe || !order.stripePaymentId) {
      return fail("Online payment is not available for this order", "PAYMENT_UNAVAILABLE", 409);
    }

    const intent = await stripe.paymentIntents.retrieve(order.stripePaymentId);

    // Paid already (the webhook may not have run yet): nothing to collect.
    if (intent.status === "succeeded") return ok({ alreadyPaid: true, clientSecret: null, amount: order.totalPrice });
    if (intent.status === "canceled" || !intent.client_secret) {
      return fail("This payment can no longer be completed. Place the order again.", "PAYMENT_CLOSED", 409);
    }

    return ok({ alreadyPaid: false, clientSecret: intent.client_secret, amount: order.totalPrice });
  } catch (error) {
    return parseError(error);
  }
}
