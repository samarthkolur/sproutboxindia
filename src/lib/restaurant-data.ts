import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Server-only reads for the restaurant portal, each scoped to the signed-in user's own
// restaurant. Like the grower reads, they do not swallow errors: a failed read reaches the
// error page and its retry instead of looking like "no orders".

// Everything the list, dashboard and detail pages need about how far an order has got.
const orderProgress = {
  delivery: { select: { status: true, packedAt: true, dispatchedAt: true, deliveredAt: true } },
  feedback: { select: { id: true, rating: true, notes: true, createdAt: true } },
  productionPlan: {
    select: {
      sowDate: true,
      harvestDate: true,
      tasks: { select: { batches: { select: { currentDay: true } } } },
    },
  },
} satisfies Prisma.OrderInclude;

/** All of the restaurant's orders, newest first. (The dashboard used to total only the latest five.) */
export async function getRestaurantOrders(userId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { userId },
    select: {
      businessName: true,
      orders: { include: orderProgress, orderBy: { createdAt: "desc" } },
    },
  });
  return restaurant;
}

export async function getRestaurantOrder(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, restaurant: { userId } },
    include: orderProgress,
  });
}

export type RestaurantOrder = NonNullable<Awaited<ReturnType<typeof getRestaurantOrders>>>["orders"][number];
