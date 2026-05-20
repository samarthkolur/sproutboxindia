"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentRestaurantOrders() {
  const session = await auth();
  if (!session?.user) return [];
  const restaurant = await prisma.restaurant.findUnique({
    where: { userId: session.user.id },
    include: { orders: { include: { delivery: true, feedback: true }, orderBy: { createdAt: "desc" } } },
  });
  return restaurant?.orders || [];
}
