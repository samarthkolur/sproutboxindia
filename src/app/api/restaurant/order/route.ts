import { OrderStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { CROP_PRICE_PER_KG } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/schemas";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "RESTAURANT") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const input = createOrderSchema.parse(await request.json());
    const restaurant = await prisma.restaurant.findUnique({ where: { userId: session.user.id } });
    if (!restaurant) return fail("Restaurant profile not found", "NOT_FOUND", 404);

    const totalPrice = Math.round(
      input.quantityKg * CROP_PRICE_PER_KG[input.cropType as keyof typeof CROP_PRICE_PER_KG]
    );

    const paymentIntent = stripe
      ? await stripe.paymentIntents.create({
          amount: totalPrice * 100,
          currency: "inr",
          customer: restaurant.stripeCustomerId || undefined,
          automatic_payment_methods: { enabled: true },
          metadata: { restaurantId: restaurant.id, cropType: input.cropType },
        })
      : null;

    const order = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        cropType: input.cropType,
        quantityKg: input.quantityKg,
        deliveryDate: input.deliveryDate,
        recurrence: input.recurrence,
        notes: input.notes,
        totalPrice,
        stripePaymentId: paymentIntent?.id,
        status: paymentIntent ? OrderStatus.PENDING_PAYMENT : OrderStatus.CONFIRMED,
      },
    });

    return ok({ order, clientSecret: paymentIntent?.client_secret || null }, 201);
  } catch (error) {
    return parseError(error);
  }
}
