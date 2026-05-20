"use server";

import { calculateProductionPlan, allocateTrays, updateGrowerScores } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import type { GrowerAllocationInput, ProductionPlanInputOrder } from "@/types";

export async function calculateProductionPlanAction(orders: ProductionPlanInputOrder[], bufferPercent?: number) {
  return calculateProductionPlan(orders, bufferPercent);
}

export async function allocateTraysAction(growers: GrowerAllocationInput[], totalTrays: number, clusterId: string) {
  return allocateTrays(growers, totalTrays, clusterId);
}

export async function updateGrowerScoresAction(growerId: string) {
  return updateGrowerScores(growerId);
}

export async function getGrowerLeaderboard(limit = 10) {
  return prisma.grower.findMany({
    take: limit,
    orderBy: { compositeScore: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });
}
