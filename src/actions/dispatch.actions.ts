"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NOT_ADMIN, requireAdmin } from "@/lib/admin-auth";

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

/** Mark every waiting task of one grower as supplied, and tell them once. */
export async function markGrowerSuppliesDelivered(growerId: string) {
  if (!(await requireAdmin())) return { ...NOT_ADMIN, count: 0 };
  const tasks = await prisma.task.findMany({ where: { growerId, status: "ASSIGNED" }, include: { grower: true } });
  if (tasks.length === 0) return { count: 0 };

  await prisma.$transaction([
    prisma.task.updateMany({ where: { id: { in: tasks.map((t) => t.id) } }, data: { status: "IN_PROGRESS" } }),
    prisma.notification.createMany({
      data: tasks.map((task) => ({
        userId: task.grower.userId,
        title: "Seeds & Trays Delivered",
        message: `Your supplies for ${task.trayCount} trays of ${task.cropType} have been delivered. You can now start growing!`,
        type: "SUPPLIES_DELIVERED",
      })),
    }),
  ]);

  revalidatePath("/admin/dispatch");
  revalidatePath("/admin/dashboard");
  return { count: tasks.length };
}
