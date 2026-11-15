"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { QCResult } from "@prisma/client";
import { NOT_ADMIN, requireAdmin } from "@/lib/admin-auth";

export async function processQCCheckIn(
  checkInId: string,
  result: QCResult,
  notes?: string
) {
  const admin = await requireAdmin();
  if (!admin) return NOT_ADMIN;
  try {
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: {
        batch: {
          include: {
            task: {
              include: { grower: true },
            },
          },
        },
      },
    });

    if (!checkIn) {
      throw new Error("Check-in not found");
    }

    // A tray that already has a verdict cannot be passed or rejected a second time: the grower
    // would be notified again and a harvested tray could be sent back to the queue.
    if (result !== "RISK" && checkIn.batch.status !== "QC_PENDING") {
      throw new Error("This tray has already been reviewed");
    }

    // Update check-in with QC result
    await prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        qcResult: result,
        qcNotes: notes ?? null,
        qcReviewedAt: new Date(),
        qcReviewedBy: admin.id,
      },
    });

    // Update batch status based on result (use correct enum values from schema)
    if (result === "PASS") {
      await prisma.batch.update({
        where: { id: checkIn.batch.id },
        data: { status: "QC_PASSED" },
      });

      // Notify the grower: batch passed
      await prisma.notification.create({
        data: {
          userId: checkIn.batch.task.grower.userId,
          title: "Batch passed QC ✅",
          message: `Tray #${checkIn.batch.trayNumber} passed quality review. Ready to harvest!`,
          type: "QC_RESULT",
        },
      });
    } else if (result === "REJECT") {
      // Schema uses "REJECTED" not "QC_FAILED"
      await prisma.batch.update({
        where: { id: checkIn.batch.id },
        data: { status: "REJECTED" },
      });

      // Notify grower: batch rejected
      await prisma.notification.create({
        data: {
          userId: checkIn.batch.task.grower.userId,
          title: "Batch rejected ❌",
          message: `Tray #${checkIn.batch.trayNumber} did not pass quality review.${notes ? ` Admin note: ${notes}` : ""}`,
          type: "QC_RESULT",
        },
      });
    }
    // RISK: keep batch as QC_PENDING, no status change needed

    revalidatePath("/admin/qc");
    revalidatePath(`/grower/tasks/${checkIn.batch.taskId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process QC";
    console.error("Failed to process QC:", error);
    return { error: message };
  }
}
