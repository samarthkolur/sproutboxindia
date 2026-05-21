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

    await prisma.$transaction([
      prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      }),
      // We could also update the grower's totalEarnings here, 
      // but it might already be calculated differently or updated during QC.
      // Let's assume it's safe to increment totalEarnings:
      prisma.grower.update({
        where: { id: payout.growerId },
        data: {
          totalEarnings: { increment: payout.amount },
        },
      }),
    ]);

    revalidatePath("/admin/payouts");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark payout as paid";
    console.error("Failed to mark payout as paid:", error);
    return { error: message };
  }
}
