"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markPayoutAsPaid(payoutId: string) {
  try {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error("Payout not found");
    }

    if (payout.status === "PAID") {
      throw new Error("Payout is already marked as paid");
    }

    // grower.totalEarnings is already incremented once, at accrual time,
    // in createHarvestPayout() (src/lib/business.ts). Marking a payout PAID
    // only settles it — it must not increment totalEarnings again, or a
    // grower's lifetime earnings figure doubles once the admin pays them.
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: "PAID",
        paidAt: new Date(),
      },
    });

    revalidatePath("/admin/payouts");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark payout as paid";
    console.error("Failed to mark payout as paid:", error);
    return { error: message };
  }
}
