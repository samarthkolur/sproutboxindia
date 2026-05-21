"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPendingDispatches() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return [];

  try {
    return await prisma.task.findMany({
      where: { status: "ASSIGNED" },
      include: {
        grower: {
          include: { user: { select: { name: true } } },
        },
        plan: {
          include: {
            order: {
              include: { restaurant: { select: { businessName: true } } },
            },
          },
        },
      },
      orderBy: { allocatedAt: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch dispatches:", error);
    return [];
  }
}

export async function markSeedsDelivered(taskId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  try {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status: "IN_PROGRESS" },
      include: { grower: true },
    });

    await prisma.notification.create({
      data: {
        userId: task.grower.userId,
        title: "Seeds & Trays Delivered",
        message: `Your supplies for ${task.trayCount} trays of ${task.cropType} have been delivered. You can now start growing!`,
        type: "SUPPLIES_DELIVERED",
      },
    });

    revalidatePath("/admin/dispatch");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to mark as delivered");
  }
}
