import { OrderStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hubCheckinSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const input = hubCheckinSchema.parse(await request.json());
    const batch = await prisma.batch.findUnique({
      where: { id: input.batchId },
      include: { task: { include: { plan: true } } },
    });
    if (!batch) return fail("Batch not found", "NOT_FOUND", 404);

    await prisma.order.update({
      where: { id: batch.task.plan.orderId },
      data: { status: OrderStatus.AT_HUB },
    });

    return ok({ batchId: input.batchId, hubId: input.hubId, actualKg: input.actualKg });
  } catch (error) {
    return parseError(error);
  }
}
