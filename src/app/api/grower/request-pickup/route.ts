import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "GROWER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await req.json();
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // 1. Fetch Task and nested relations
    const task = await prisma.task.findUnique({
      where: { id: taskId, grower: { userId: session.user.id } },
      include: {
        grower: true,
        plan: {
          include: {
            order: {
              include: {
                restaurant: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (task.status === "HARVEST_READY" || task.status === "HARVESTED") {
      return NextResponse.json(
        { error: "Task is already ready or harvested" },
        { status: 400 }
      );
    }

    // 2. Update Task Status
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "HARVEST_READY" },
    });
    
    // Also update batches to QC_PASSED or PRE_HARVEST to reflect it's ready
    await prisma.batch.updateMany({
      where: { taskId },
      data: { status: "PRE_HARVEST" }
    });

    // 3. Notify Admin
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "Pickup Requested",
          message: `Grower ${task.grower.id.slice(0, 5)} requested pickup for ${task.trayCount} trays of ${task.cropType}.`,
          type: "pickup_ready",
        })),
      });
    }

    // 4. Notify Restaurant
    if (task.plan?.order?.restaurant) {
      await prisma.notification.create({
        data: {
          userId: task.plan.order.restaurant.userId,
          title: "Your Microgreens are Ready!",
          message: `Your order for ${task.cropType} is ready and will be delivered today.`,
          type: "order_ready",
        },
      });
    }

    // [Optional] Email logic could go here using Nodemailer or Resend

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[REQUEST_PICKUP_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to request pickup" },
      { status: 500 }
    );
  }
}
