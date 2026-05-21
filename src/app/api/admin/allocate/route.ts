import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { allocateSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const input = allocateSchema.parse(await request.json());
    const plan = await prisma.productionPlan.findUnique({
      where: { id: input.planId },
      include: { order: true },
    });

    if (!plan) return fail("Production plan not found", "NOT_FOUND", 404);
    if (plan.status !== "DRAFT") {
      return fail("Production plan is not in DRAFT status", "VALIDATION_ERROR", 422);
    }

    const result = await prisma.$transaction(async (tx) => {
      const tasks = [];

      for (const allocation of input.allocations) {
        if (allocation.trayCount <= 0) continue;

        const grower = await tx.grower.findUnique({
          where: { id: allocation.growerId },
        });
        if (!grower || !grower.isActive) continue;

        const task = await tx.task.create({
          data: {
            planId: input.planId,
            growerId: allocation.growerId,
            cropType: plan.order.cropType,
            trayCount: allocation.trayCount,
            sowDate: plan.sowDate,
            harvestDate: plan.harvestDate,
            batches: {
              createMany: {
                data: Array.from({ length: allocation.trayCount }, (_, index) => ({
                  trayNumber: index + 1,
                })),
              },
            },
          },
          include: { batches: true },
        });

        // Notify grower of new task
        await tx.notification.create({
          data: {
            userId: grower.userId,
            title: "New trays assigned 🌱",
            message: `You have been assigned ${allocation.trayCount} ${plan.order.cropType} tray${
              allocation.trayCount > 1 ? "s" : ""
            } to sow. Harvest by ${plan.harvestDate.toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
            })}.`,
            type: "TASK_ASSIGNED",
          },
        });

        tasks.push(task);
      }

      // Mark production plan as ACTIVE after allocation
      await tx.productionPlan.update({
        where: { id: input.planId },
        data: { status: "ACTIVE" },
      });

      return tasks;
    });

    return ok(result, 201);
  } catch (error) {
    return parseError(error);
  }
}
