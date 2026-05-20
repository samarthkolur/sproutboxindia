import { DeliveryStatus, OrderStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { deliveryDispatchSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const input = deliveryDispatchSchema.parse(await request.json());
    const delivery = await prisma.delivery.upsert({
      where: { orderId: input.orderId },
      update: {
        hubId: input.hubId,
        driverName: input.driverName,
        driverPhone: input.driverPhone,
        status: DeliveryStatus.IN_TRANSIT,
        dispatchedAt: new Date(),
      },
      create: {
        orderId: input.orderId,
        hubId: input.hubId,
        driverName: input.driverName,
        driverPhone: input.driverPhone,
        status: DeliveryStatus.IN_TRANSIT,
        dispatchedAt: new Date(),
      },
    });

    await prisma.order.update({ where: { id: input.orderId }, data: { status: OrderStatus.IN_TRANSIT } });
    return ok(delivery);
  } catch (error) {
    return parseError(error);
  }
}
