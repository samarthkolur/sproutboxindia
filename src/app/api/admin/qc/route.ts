import { BatchStatus, QCResult, TaskStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { updateGrowerScores } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { qcSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const queue = await prisma.batch.findMany({
      where: { status: BatchStatus.QC_PENDING },
      include: {
        checkIns: { orderBy: { createdAt: "desc" }, take: 1 },
        task: { include: { grower: { include: { user: true, cluster: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    return ok(queue);
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

    const input = qcSchema.parse(await request.json());
    const batch = await prisma.batch.findUnique({
      where: { id: input.batchId },
      include: { task: { include: { grower: true } } },
    });

    if (!batch) return fail("Batch not found", "NOT_FOUND", 404);

    const nextStatus = input.result === QCResult.PASS ? BatchStatus.QC_PASSED
      : input.result === QCResult.REJECT ? BatchStatus.REJECTED
      : BatchStatus.QC_PENDING;

    const result = await prisma.$transaction(async (tx) => {
      const checkIn = await tx.checkIn.update({
        where: { id: input.checkInId },
        data: {
          qcResult: input.result,
          qcNotes: input.notes,
          qcReviewedAt: new Date(),
          qcReviewedBy: session.user.id,
        },
      });

      await tx.batch.update({ where: { id: input.batchId }, data: { status: nextStatus } });

      if (nextStatus === BatchStatus.QC_PASSED) {
        await tx.task.update({ where: { id: batch.taskId }, data: { status: TaskStatus.HARVEST_READY } });
      }

      await tx.notification.create({
        data: {
          userId: batch.task.grower.userId,
          title: input.result === QCResult.PASS ? "Batch passed QC" : "QC review updated",
          message: input.result === QCResult.PASS
            ? `Batch ${input.batchId.slice(0, 8).toUpperCase()} passed QC and is ready to harvest.`
            : `Batch ${input.batchId.slice(0, 8).toUpperCase()} was marked ${input.result}.`,
          type: "QC_RESULT",
        },
      });

      return checkIn;
    });

    if (nextStatus === BatchStatus.REJECTED) {
      await updateGrowerScores(batch.task.growerId);
    }

    return ok(result);
  } catch (error) {
    return parseError(error);
  }
}
