"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { QCResult } from "@prisma/client";

export async function processQCCheckIn(
  checkInId: string,
  result: QCResult,
  notes?: string
) {
  try {
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: checkInId },
      include: { batch: true },
    });

    if (!checkIn) {
      throw new Error("Check-in not found");
    }

    // Update check-in
    await prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        qcResult: result,
        qcNotes: notes,
        qcReviewedAt: new Date(),
        // qcReviewedBy: "admin-id" // Assuming admin ID if available in session
      },
    });

    // Optionally update batch status based on result
    let batchStatus = checkIn.batch.status;
    if (result === "PASS") {
      batchStatus = "QC_PASSED";
    } else if (result === "REJECT") {
      batchStatus = "QC_FAILED";
    }

    if (batchStatus !== checkIn.batch.status) {
      await prisma.batch.update({
        where: { id: checkIn.batch.id },
        data: { status: batchStatus },
      });
    }

    revalidatePath("/admin/qc");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process QC";
    console.error("Failed to process QC:", error);
    return { error: message };
  }
}
