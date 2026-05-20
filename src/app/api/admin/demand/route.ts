import { OrderStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { calculateProductionPlan } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { demandSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const input = demandSchema.parse(await request.json());
    const orders = await prisma.order.findMany({
      where: { id: { in: input.orderIds }, productionPlan: null },
    });

    if (orders.length === 0) return fail("No eligible orders found", "NO_ORDERS", 404);

    const sowDate = input.sowDate || new Date();
    const created = await prisma.$transaction(async (tx) => {
      const plans = [];

      for (const order of orders) {
        const [summary] = calculateProductionPlan([order], input.bufferPercent, sowDate);
        const plan = await tx.productionPlan.create({
          data: {
            orderId: order.id,
            totalKg: summary.totalKg,
            totalTrays: summary.totalTrays,
            bufferTrays: summary.bufferTrays,
            bufferPercent: input.bufferPercent,
            sowDate: summary.sowDate,
            harvestDate: summary.harvestDate,
            status: "ACTIVE",
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.IN_PRODUCTION },
        });

        plans.push({ ...plan, baseTrays: summary.baseTrays, cropType: summary.cropType });
      }

      return plans;
    });

    return ok(created, 201);
  } catch (error) {
    return parseError(error);
  }
}
