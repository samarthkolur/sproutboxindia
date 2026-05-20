import { DeliveryStatus, OrderStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { deliveryUpdateSchema } from "@/lib/schemas";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const input = deliveryUpdateSchema.parse(await request.json());
    const delivery = await prisma.delivery.update({
      where: { id: params.id },
      data: {
        status: input.status,
        packedAt: input.status === DeliveryStatus.PACKED ? new Date() : undefined,
        dispatchedAt: input.status === DeliveryStatus.IN_TRANSIT ? new Date() : undefined,
        deliveredAt: input.status === DeliveryStatus.DELIVERED ? new Date() : undefined,
      },
    });

    if (input.status === DeliveryStatus.DELIVERED) {
      await prisma.order.update({ where: { id: delivery.orderId }, data: { status: OrderStatus.DELIVERED } });
    }

    return ok(delivery);
  } catch (error) {
    return parseError(error);
  }
}
