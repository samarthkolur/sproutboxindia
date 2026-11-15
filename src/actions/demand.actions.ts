"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NOT_ADMIN, requireAdmin } from "@/lib/admin-auth";
import { planOrder } from "@/lib/admin";

export async function createProductionPlan(orderId: string) {
  if (!(await requireAdmin())) return NOT_ADMIN;
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

    // The same calculation the Demand page previews, so what is shown is what is stored.
    const plan = planOrder(order);

    // Create plan in a transaction
    await prisma.$transaction([
      prisma.productionPlan.create({
        data: {
          orderId: order.id,
          totalKg: order.quantityKg,
          totalTrays: plan.totalTrays,
          bufferTrays: plan.bufferTrays,
          bufferPercent: plan.bufferPercent,
          sowDate: plan.sowDate,
          harvestDate: plan.harvestDate,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create production plan";
    console.error("Failed to create production plan:", error);
    return { error: message };
  }
}

/** Create plans for several orders at once. Each is its own transaction, so one bad order does not block the rest. */
export async function createProductionPlans(orderIds: string[]) {
  if (!(await requireAdmin())) return { ...NOT_ADMIN, created: 0, failed: [] as { orderId: string; error: string }[] };
  const failed: { orderId: string; error: string }[] = [];
  let created = 0;
  for (const orderId of orderIds.slice(0, 50)) {
    const result = await createProductionPlan(orderId);
    if ("error" in result && result.error) failed.push({ orderId, error: result.error });
    else created += 1;
  }
  revalidatePath("/admin/allocate");
  return { created, failed };
}
