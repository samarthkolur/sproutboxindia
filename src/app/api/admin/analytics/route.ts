import { subWeeks } from "date-fns";
import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const since = subWeeks(new Date(), 8);
    const [orders, batches, checkIns, leaderboard, feedbacks] = await Promise.all([
      prisma.order.findMany({ where: { createdAt: { gte: since } } }),
      prisma.task.findMany({ where: { allocatedAt: { gte: since } } }),
      prisma.checkIn.findMany({ where: { qcReviewedAt: { gte: since } } }),
      prisma.grower.findMany({
        take: 10,
        orderBy: { compositeScore: "desc" },
        include: { user: { select: { name: true } } },
      }),
      prisma.feedback.findMany({ where: { createdAt: { gte: subWeeks(new Date(), 4) } }, include: { restaurant: true } }),
    ]);

    return ok({
      revenueTotal: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      productionTrays: batches.reduce((sum, task) => sum + task.trayCount, 0),
      qc: {
        pass: checkIns.filter((item) => item.qcResult === "PASS").length,
        risk: checkIns.filter((item) => item.qcResult === "RISK").length,
        reject: checkIns.filter((item) => item.qcResult === "REJECT").length,
      },
      leaderboard: leaderboard.map((grower) => ({
        id: grower.id,
        name: grower.user.name,
        score: grower.compositeScore,
      })),
      satisfaction:
        feedbacks.length > 0
          ? feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length
          : 0,
    });
  } catch (error) {
    return parseError(error);
  }
}
