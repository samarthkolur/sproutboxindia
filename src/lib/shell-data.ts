import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { countCheckinsDue, cropName, getTaskState } from "@/lib/tasks";
import type { NavBadges, Role } from "@/lib/nav";

// Server-only data for the dashboard shell: sidebar badges, the pinned
// "next action" card, the workspace subtitle and the unread count.
// Never throws: a DB hiccup must not take down every page.

export interface PinnedCard {
  label: string;
  value: string;
  caption: string;
  href: string;
}

export interface ShellData {
  badges: NavBadges;
  pinned: PinnedCard;
  workspace: string;
  unread: number;
}

const FALLBACK: Record<Role, ShellData> = {
  ADMIN: {
    badges: {},
    workspace: "Operations",
    unread: 0,
    pinned: { label: "Awaiting QC", value: "—", caption: "Open the QC queue", href: "/admin/qc" },
  },
  RESTAURANT: {
    badges: {},
    workspace: "Restaurant",
    unread: 0,
    pinned: { label: "Next delivery", value: "—", caption: "Place an order", href: "/restaurant/order/new" },
  },
  GROWER: {
    badges: {},
    workspace: "Grower",
    unread: 0,
    pinned: { label: "Next check-in", value: "—", caption: "Open your tasks", href: "/grower/tasks" },
  },
};

export async function getShellData(role: Role, userId: string): Promise<ShellData> {
  try {
    const unread = await prisma.notification.count({ where: { userId, read: false } });
    const data =
      role === "ADMIN"
        ? await adminShell()
        : role === "RESTAURANT"
          ? await restaurantShell(userId)
          : await growerShell(userId);
    return { ...data, unread };
  } catch (error) {
    console.error("getShellData failed", error);
    return FALLBACK[role];
  }
}

async function adminShell(): Promise<Omit<ShellData, "unread">> {
  const [demand, allocations, dispatch, qc, payouts, cluster] = await Promise.all([
    prisma.order.count({ where: { status: "CONFIRMED", productionPlan: null } }),
    prisma.productionPlan.count({ where: { status: "DRAFT" } }),
    prisma.task.count({ where: { status: "ASSIGNED" } }),
    prisma.batch.count({ where: { status: "QC_PENDING" } }),
    prisma.payout.count({ where: { status: "PENDING" } }),
    prisma.cluster.findFirst({ select: { name: true } }),
  ]);

  return {
    workspace: cluster?.name ?? FALLBACK.ADMIN.workspace,
    badges: {
      adminDemand: demand,
      adminAllocations: allocations,
      adminDispatch: dispatch,
      adminQc: qc,
      adminPayouts: payouts,
    },
    pinned:
      qc > 0
        ? {
            label: "Awaiting QC",
            value: String(qc),
            caption: qc === 1 ? "batch to review" : "batches to review",
            href: "/admin/qc",
          }
        : { label: "Awaiting QC", value: "All clear", caption: "No batches waiting", href: "/admin/qc" },
  };
}

async function restaurantShell(userId: string): Promise<Omit<ShellData, "unread">> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { userId },
    select: { id: true, businessName: true },
  });
  if (!restaurant) return FALLBACK.RESTAURANT;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [awaitingPayment, next] = await Promise.all([
    prisma.order.count({ where: { restaurantId: restaurant.id, status: "PENDING_PAYMENT" } }),
    prisma.order.findFirst({
      where: {
        restaurantId: restaurant.id,
        status: { in: ["CONFIRMED", "IN_PRODUCTION", "AT_HUB", "IN_TRANSIT"] },
        deliveryDate: { gte: startOfToday },
      },
      orderBy: { deliveryDate: "asc" },
      select: { id: true, cropType: true, quantityKg: true, deliveryDate: true },
    }),
  ]);

  return {
    workspace: restaurant.businessName,
    badges: { restaurantAwaitingPayment: awaitingPayment },
    pinned: next
      ? {
          label: "Next delivery",
          value: format(next.deliveryDate, "EEE, d MMM"),
          caption: `${cropName(next.cropType)} · ${next.quantityKg} kg`,
          href: `/restaurant/orders/${next.id}`,
        }
      : {
          label: "Next delivery",
          value: "None scheduled",
          caption: "Place an order",
          href: "/restaurant/order/new",
        },
  };
}

async function growerShell(userId: string): Promise<Omit<ShellData, "unread">> {
  const grower = await prisma.grower.findUnique({
    where: { userId },
    select: {
      city: true,
      tasks: {
        where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
        orderBy: { sowDate: "asc" },
        include: {
          batches: {
            include: { checkIns: { orderBy: { day: "desc" }, take: 1 } },
            orderBy: { trayNumber: "asc" },
          },
        },
      },
    },
  });
  if (!grower) return FALLBACK.GROWER;

  const due = countCheckinsDue(grower.tasks);
  const nextTask = grower.tasks.find((task) => getTaskState(task).canCheckIn);
  const state = nextTask ? getTaskState(nextTask) : null;

  return {
    workspace: grower.city,
    badges: { growerCheckinsDue: due },
    pinned:
      nextTask && state
        ? {
            label: "Next check-in",
            value: `Day ${state.currentDay + 1}`,
            caption: `${cropName(nextTask.cropType)} · ${nextTask.trayCount} trays`,
            href: `/grower/tasks/${nextTask.id}`,
          }
        : { label: "Next check-in", value: "All checked in", caption: "Nothing due today", href: "/grower/tasks" },
  };
}
