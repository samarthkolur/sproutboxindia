import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ received: true, skipped: true });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      await prisma.order.updateMany({
        where: { stripePaymentId: paymentIntent.id },
        data: { status: OrderStatus.CONFIRMED },
      });
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const orders = await prisma.order.findMany({
        where: { stripePaymentId: paymentIntent.id },
        include: { restaurant: true },
      });
      await prisma.notification.createMany({
        data: orders.map((order) => ({
          userId: order.restaurant.userId,
          title: "Payment failed",
          message: `Payment failed for order ${order.id.slice(0, 8).toUpperCase()}.`,
          type: "SYSTEM",
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });
  }
}
