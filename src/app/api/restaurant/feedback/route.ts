import { OrderStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { updateGrowerScores } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { feedbackSchema } from "@/lib/schemas";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "RESTAURANT") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const input = feedbackSchema.parse(await request.json());
    const restaurant = await prisma.restaurant.findUnique({ where: { userId: session.user.id } });
    if (!restaurant) return fail("Restaurant profile not found", "NOT_FOUND", 404);

    const order = await prisma.order.findFirst({
      where: { id: input.orderId, restaurantId: restaurant.id },
      include: { productionPlan: { include: { tasks: true } } },
    });

    if (!order) return fail("Order not found", "NOT_FOUND", 404);

    const feedback = await prisma.$transaction(async (tx) => {
      const saved = await tx.feedback.upsert({
        where: { orderId: input.orderId },
        update: { rating: input.rating, notes: input.notes, imageUrl: input.imageUrl },
        create: {
          orderId: input.orderId,
          restaurantId: restaurant.id,
          rating: input.rating,
          notes: input.notes,
          imageUrl: input.imageUrl,
        },
      });

      await tx.order.update({
        where: { id: input.orderId },
        data: { status: OrderStatus.DELIVERED },
      });

      return saved;
    });

    const growerIds = (order.productionPlan?.tasks || []).reduce<string[]>((ids, task) => {
      return ids.includes(task.growerId) ? ids : [...ids, task.growerId];
    }, []);
    await Promise.all(growerIds.map((growerId) => updateGrowerScores(growerId)));

    return ok(feedback);
  } catch (error) {
    return parseError(error);
  }
}
