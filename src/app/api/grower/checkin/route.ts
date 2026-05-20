import { BatchStatus, TaskStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { CROP_CYCLE_DAYS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { checkinSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "GROWER") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const input = checkinSchema.parse(await request.json());
    const batch = await prisma.batch.findUnique({
      where: { id: input.batchId },
      include: { task: { include: { grower: true } } },
    });

    if (!batch || batch.task.grower.userId !== session.user.id) {
      return fail("Batch not found", "NOT_FOUND", 404);
    }

    const cycleDays = CROP_CYCLE_DAYS[batch.task.cropType as keyof typeof CROP_CYCLE_DAYS] || 9;
    const nextStatus = input.day >= cycleDays - 1 ? BatchStatus.QC_PENDING
      : input.day >= Math.max(1, cycleDays - 2) ? BatchStatus.PRE_HARVEST
      : BatchStatus.GROWING;

    const result = await prisma.$transaction(async (tx) => {
      const checkIn = await tx.checkIn.create({
        data: {
          batchId: input.batchId,
          day: input.day,
          imageTopUrl: input.imageTopUrl,
          imageSideUrl: input.imageSideUrl,
          notes: input.notes,
        },
      });

      await tx.batch.update({
        where: { id: input.batchId },
        data: { currentDay: input.day, status: nextStatus },
      });

      await tx.task.update({
        where: { id: batch.taskId },
        data: { status: TaskStatus.IN_PROGRESS },
      });

      if (nextStatus === BatchStatus.QC_PENDING) {
        const admins = await tx.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: "Batch ready for QC",
            message: `Batch ${input.batchId.slice(0, 8).toUpperCase()} is ready for review.`,
            type: "QC_RESULT",
          })),
        });
      }

      return checkIn;
    });

    return ok(result, 201);
  } catch (error) {
    return parseError(error);
  }
}
