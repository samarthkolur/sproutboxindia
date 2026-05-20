import { BatchStatus, TaskStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { createHarvestPayout, updateGrowerScores } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { harvestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "GROWER") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const input = harvestSchema.parse(await request.json());
    const batch = await prisma.batch.findUnique({
      where: { id: input.batchId },
      include: { task: { include: { grower: true } } },
    });

    if (!batch || batch.task.grower.userId !== session.user.id) {
      return fail("Batch not found", "NOT_FOUND", 404);
    }

    if (batch.status !== BatchStatus.QC_PASSED) {
      return fail("Batch must pass QC before harvest", "QC_REQUIRED", 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBatch = await tx.batch.update({
        where: { id: input.batchId },
        data: {
          status: BatchStatus.HARVESTED,
          actualYieldGrams: input.actualYieldGrams,
          harvestImageUrl: input.harvestImageUrl,
          harvestedAt: new Date(),
        },
      });

      const remainingOpen = await tx.batch.count({
        where: {
          taskId: batch.taskId,
          status: { notIn: [BatchStatus.HARVESTED, BatchStatus.REJECTED] },
        },
      });

      if (remainingOpen === 0) {
        await tx.task.update({ where: { id: batch.taskId }, data: { status: TaskStatus.HARVESTED } });
      }

      const payout = await createHarvestPayout(input.batchId, tx);
      if (payout) {
        await tx.notification.create({
          data: {
            userId: session.user.id,
            title: "Payout queued",
            message: `Payout of ₹${payout.amount} queued for batch ${input.batchId.slice(0, 8).toUpperCase()}.`,
            type: "PAYOUT",
          },
        });
      }

      return updatedBatch;
    });

    await updateGrowerScores(batch.task.growerId);
    return ok(result);
  } catch (error) {
    return parseError(error);
  }
}
