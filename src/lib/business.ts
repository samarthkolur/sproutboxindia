import { addDays } from "date-fns";
import { BatchStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CROP_CYCLE_DAYS,
  DEFAULT_BUFFER_PERCENT,
  PAYOUT_PER_TRAY,
  TRAY_YIELD_GRAMS,
} from "@/lib/constants";
import type {
  AllocationResult,
  GrowerAllocationInput,
  ProductionPlanInputOrder,
} from "@/types";

export function calculateProductionPlan(
  orders: ProductionPlanInputOrder[],
  bufferPercent = DEFAULT_BUFFER_PERCENT,
  sowDate = new Date()
) {
  const grouped = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.cropType] = (acc[order.cropType] || 0) + order.quantityKg;
    return acc;
  }, {});

  return Object.entries(grouped).map(([cropType, totalKg]) => {
    const baseTrays = Math.ceil((totalKg * 1000) / TRAY_YIELD_GRAMS);
    const bufferTrays = Math.ceil(baseTrays * bufferPercent);
    const totalTrays = baseTrays + bufferTrays;
    const cycleDays = CROP_CYCLE_DAYS[cropType as keyof typeof CROP_CYCLE_DAYS] || 9;
    const harvestDate = addDays(sowDate, cycleDays);

    return { cropType, totalKg, baseTrays, bufferTrays, totalTrays, sowDate, harvestDate };
  });
}

export function allocateTrays(
  growers: GrowerAllocationInput[],
  totalTrays: number,
  clusterId: string
): AllocationResult[] {
  const eligible = growers
    .filter((grower) => grower.clusterId === clusterId && grower.isActive)
    .sort((a, b) => b.compositeScore - a.compositeScore);

  if (eligible.length === 0 || totalTrays <= 0) return [];

  const totalScore = eligible.reduce((sum, grower) => sum + grower.compositeScore, 0) || eligible.length;
  let assigned = 0;

  return eligible
    .map((grower, index) => {
      const weighted = totalScore === eligible.length
        ? totalTrays / eligible.length
        : (grower.compositeScore / totalScore) * totalTrays;
      const trayCount = index === eligible.length - 1
        ? totalTrays - assigned
        : Math.round(weighted);

      assigned += trayCount;
      return { growerId: grower.id, trayCount };
    })
    .filter((allocation) => allocation.trayCount > 0);
}

export async function updateGrowerScores(growerId: string) {
  const recentBatches = await prisma.batch.findMany({
    where: {
      task: { growerId },
      status: { in: [BatchStatus.HARVESTED, BatchStatus.REJECTED] },
    },
    include: { task: true },
    orderBy: [{ harvestedAt: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  const harvested = recentBatches.filter((batch) => batch.status === BatchStatus.HARVESTED);
  const yieldWindow = harvested.slice(0, 10);

  const yieldScore = yieldWindow.length > 0
    ? yieldWindow.reduce((sum, batch) => {
        const expected = batch.task.trayCount * TRAY_YIELD_GRAMS;
        return sum + Math.min((batch.actualYieldGrams || 0) / expected, 1);
      }, 0) / yieldWindow.length
    : 0.5;

  const qualityScore = recentBatches.length > 0 ? harvested.length / recentBatches.length : 0.5;

  const timelinessScore = harvested.length > 0
    ? harvested.filter((batch) => batch.harvestedAt && batch.harvestedAt <= batch.task.harvestDate).length /
      harvested.length
    : 0.5;

  const compositeScore = (yieldScore * 0.4) + (qualityScore * 0.4) + (timelinessScore * 0.2);

  return prisma.grower.update({
    where: { id: growerId },
    data: { yieldScore, qualityScore, timelinessScore, compositeScore },
  });
}

export async function createHarvestPayout(batchId: string, tx: Prisma.TransactionClient = prisma) {
  const batch = await tx.batch.findUnique({
    where: { id: batchId },
    include: { task: true, payout: true },
  });

  if (!batch || batch.payout) return null;

  const amount = PAYOUT_PER_TRAY;
  const payout = await tx.payout.create({
    data: {
      growerId: batch.task.growerId,
      batchId,
      amount,
    },
  });

  await tx.grower.update({
    where: { id: batch.task.growerId },
    data: { totalEarnings: { increment: amount } },
  });

  return payout;
}
