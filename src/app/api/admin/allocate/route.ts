import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { allocateTrays } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { allocateSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const url = new URL(request.url);
    const planId = url.searchParams.get("planId");
    if (!planId) return fail("planId is required", "VALIDATION_ERROR", 422);

    const [plan, growers] = await Promise.all([
      prisma.productionPlan.findUnique({ where: { id: planId }, include: { order: true } }),
      prisma.grower.findMany({ where: { isActive: true }, include: { user: true, cluster: true } }),
    ]);

    if (!plan) return fail("Plan not found", "NOT_FOUND", 404);
    const clusterId = growers[0]?.clusterId || "";
    const allocations = allocateTrays(growers, plan.totalTrays, clusterId).map((allocation) => {
      const grower = growers.find((item) => item.id === allocation.growerId);
      return {
        ...allocation,
        growerName: grower?.user.name || "Grower",
        compositeScore: grower?.compositeScore || 0,
      };
    });

    return ok({ plan, allocations });
  } catch (error) {
    return parseError(error);
  }
}

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

    const result = await prisma.$transaction(async (tx) => {
      const tasks = [];

      for (const allocation of input.allocations) {
        const grower = await tx.grower.findUnique({ where: { id: allocation.growerId } });
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

        await tx.notification.create({
          data: {
            userId: grower.userId,
            title: "New trays assigned",
            message: `You have ${allocation.trayCount} ${plan.order.cropType} trays to sow.`,
            type: "TASK_ASSIGNED",
          },
        });

        tasks.push(task);
      }

      return tasks;
    });

    return ok(result, 201);
  } catch (error) {
    return parseError(error);
  }
}
