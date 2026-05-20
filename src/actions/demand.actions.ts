"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TRAY_YIELD_GRAMS, DEFAULT_BUFFER_PERCENT } from "@/lib/constants";

export async function createProductionPlan(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "CONFIRMED") {
      throw new Error("Order must be CONFIRMED to create a production plan");
    }

    const traysNeeded = Math.ceil((order.quantityKg * 1000) / TRAY_YIELD_GRAMS);
    const bufferTrays = Math.ceil(traysNeeded * DEFAULT_BUFFER_PERCENT);
    const totalTrays = traysNeeded + bufferTrays;

    // Simple estimation for dates (e.g. harvest date is delivery date - 1 day, sow date is harvest date - 10 days)
    const harvestDate = new Date(order.deliveryDate);
    harvestDate.setDate(harvestDate.getDate() - 1);
    
    const sowDate = new Date(harvestDate);
    sowDate.setDate(sowDate.getDate() - 10);

    // Create plan in a transaction
    await prisma.$transaction([
      prisma.productionPlan.create({
        data: {
          orderId: order.id,
          totalKg: order.quantityKg,
          totalTrays: totalTrays,
          bufferTrays: bufferTrays,
          bufferPercent: DEFAULT_BUFFER_PERCENT,
          sowDate,
          harvestDate,
          status: "DRAFT",
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: "IN_PRODUCTION" },
      }),
    ]);

    revalidatePath("/admin/demand");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create production plan:", error);
    return { error: error.message || "Failed to create production plan" };
  }
}
