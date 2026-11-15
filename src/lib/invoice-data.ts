import { prisma } from "@/lib/prisma";
import type { GrowerStatementInput, RestaurantInvoiceInput, SettlementInput } from "@/lib/invoices";

// Reads for the invoice downloads. Each takes who is asking: an owner gets only their own
// rows, an admin gets any. They return null when there is nothing the viewer may see, and
// the route answers 404 for both "missing" and "not yours" so ids cannot be probed.

export interface Viewer {
  id: string;
  role: "ADMIN" | "RESTAURANT" | "GROWER";
}

export async function getRestaurantInvoiceInput(orderId: string, viewer: Viewer): Promise<RestaurantInvoiceInput | null> {
  if (viewer.role === "GROWER") return null;
  const order = await prisma.order.findFirst({
    where: viewer.role === "ADMIN" ? { id: orderId } : { id: orderId, restaurant: { userId: viewer.id } },
    include: { restaurant: true, delivery: { select: { deliveredAt: true } } },
  });
  if (!order) return null;
  const { restaurant } = order;
  return {
    order: {
      id: order.id,
      cropType: order.cropType,
      quantityKg: order.quantityKg,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
      deliveryDate: order.deliveryDate,
    },
    restaurant: {
      businessName: restaurant.businessName,
      contactName: restaurant.contactName,
      address: restaurant.address,
      city: restaurant.city,
      pincode: restaurant.pincode,
      phone: restaurant.phone,
      gstin: restaurant.gstin,
    },
    deliveredAt: order.delivery?.deliveredAt ?? null,
  };
}

export async function getGrowerStatementInput(taskId: string, viewer: Viewer): Promise<GrowerStatementInput | null> {
  if (viewer.role === "RESTAURANT") return null;
  const task = await prisma.task.findFirst({
    where: viewer.role === "ADMIN" ? { id: taskId } : { id: taskId, grower: { userId: viewer.id } },
    include: {
      grower: { include: { user: { select: { name: true } } } },
      plan: { select: { orderId: true } },
      batches: {
        orderBy: { trayNumber: "asc" },
        select: {
          status: true,
          harvestedAt: true,
          payout: { select: { amount: true, status: true, paidAt: true, createdAt: true } },
        },
      },
    },
  });
  if (!task) return null;
  return {
    task: { id: task.id, cropType: task.cropType, trayCount: task.trayCount, sowDate: task.sowDate, harvestDate: task.harvestDate, orderId: task.plan.orderId },
    grower: {
      name: task.grower.user.name ?? "Grower",
      address: task.grower.address,
      city: task.grower.city,
      pincode: task.grower.pincode,
      phone: task.grower.phone,
      upiId: task.grower.upiId,
    },
    batches: task.batches,
  };
}

/** Admin only. */
export async function getSettlementInput(orderId: string): Promise<SettlementInput | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: { select: { businessName: true } },
      delivery: { select: { deliveredAt: true } },
      productionPlan: {
        include: {
          tasks: {
            include: {
              grower: { include: { user: { select: { name: true } } } },
              batches: { select: { status: true, payout: { select: { amount: true, status: true } } } },
            },
          },
        },
      },
    },
  });
  if (!order || !order.productionPlan) return null;

  // One line per grower, even if they were given the order in more than one task.
  const byGrower = new Map<string, SettlementInput["growers"][number]>();
  for (const task of order.productionPlan.tasks) {
    const entry = byGrower.get(task.growerId) ?? { name: task.grower.user.name ?? "Grower", trays: 0, rejected: 0, payout: 0, paid: true };
    for (const batch of task.batches) {
      if (batch.payout) {
        entry.trays += 1;
        entry.payout += batch.payout.amount;
        if (batch.payout.status !== "PAID") entry.paid = false;
      } else if (batch.status === "REJECTED") {
        entry.rejected += 1;
      }
    }
    byGrower.set(task.growerId, entry);
  }

  return {
    order: { id: order.id, cropType: order.cropType, quantityKg: order.quantityKg, totalPrice: order.totalPrice, createdAt: order.createdAt },
    restaurantName: order.restaurant.businessName,
    deliveredAt: order.delivery?.deliveredAt ?? null,
    growers: Array.from(byGrower.values()),
  };
}
