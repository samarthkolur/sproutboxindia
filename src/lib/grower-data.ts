import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Server-only reads for the grower portal. Each takes the signed-in user's id and
// scopes every query to that grower, so a page can never show someone else's tray.
// They do not swallow errors: a failed read reaches the dashboard error page, which
// offers a retry, instead of passing off a database hiccup as "no tasks".

// Newest check-in first: the task maths only needs to know whether one happened today.
const withLatestCheckIn = {
  batches: {
    include: { checkIns: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { trayNumber: "asc" },
  },
} satisfies Prisma.TaskInclude;

// The yield, quality and timeliness scores are computed from finished trays (harvested or
// rejected), see updateGrowerScores. Until there is one, the stored 0.5 is only a default.
function countScoredTrays(growerId: string) {
  return prisma.batch.count({ where: { task: { growerId }, status: { in: ["HARVESTED", "REJECTED"] } } });
}

const OPEN_STATUSES = ["ASSIGNED", "IN_PROGRESS", "HARVEST_READY"] as const;

export async function getGrowerHome(userId: string) {
  const grower = await prisma.grower.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true } },
      tasks: {
        where: { status: { in: [...OPEN_STATUSES] } },
        include: withLatestCheckIn,
        orderBy: { sowDate: "asc" },
      },
    },
  });
  if (!grower) return null;

  const [payouts, scoredTrays, notifications] = await Promise.all([
    prisma.payout.findMany({
      where: { growerId: grower.id },
      select: { amount: true, status: true, paidAt: true },
    }),
    countScoredTrays(grower.id),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return { grower, payouts, scoredTrays, notifications };
}

export async function getGrowerTasks(userId: string) {
  const grower = await prisma.grower.findUnique({
    where: { userId },
    select: {
      tasks: { include: withLatestCheckIn, orderBy: { sowDate: "desc" } },
    },
  });
  return grower ? grower.tasks : null;
}

export async function getGrowerTask(userId: string, taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, grower: { userId } },
    include: {
      batches: {
        include: {
          // The whole history, newest first: the gallery shows it that way and the task
          // maths reads the latest check-in from the front.
          checkIns: { orderBy: { createdAt: "desc" } },
          payout: { select: { amount: true, status: true } },
        },
        orderBy: { trayNumber: "asc" },
      },
    },
  });
}

export async function getGrowerEarnings(userId: string) {
  const grower = await prisma.grower.findUnique({
    where: { userId },
    select: {
      id: true,
      payouts: {
        orderBy: { createdAt: "desc" },
        include: { batch: { select: { trayNumber: true, task: { select: { id: true, cropType: true } } } } },
      },
    },
  });
  return grower ? grower.payouts : null;
}

export async function getGrowerProfile(userId: string) {
  const grower = await prisma.grower.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!grower) return null;
  return { grower, scoredTrays: await countScoredTrays(grower.id) };
}
