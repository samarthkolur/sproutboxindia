import { prisma } from "@/lib/prisma";
import { Target } from "lucide-react";
import { AllocateClient } from "./AllocateClient";

async function getAllocationData() {
  try {
    const [plans, growers] = await Promise.all([
      prisma.productionPlan.findMany({
        where: { status: "DRAFT" },
        include: {
          order: {
            include: {
              restaurant: { select: { businessName: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.grower.findMany({
        where: { isActive: true },
        include: {
          user: { select: { name: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { compositeScore: "desc" },
      }),
    ]);

    return {
      plans,
      growers: growers.map((g) => ({
        id: g.id,
        name: g.user.name || "Unknown Grower",
        city: g.city,
        kitSize: g.kitSize,
        compositeScore: g.compositeScore,
        taskCount: g._count.tasks,
      })),
    };
  } catch {
    return { plans: [], growers: [] };
  }
}

export default async function AllocatePage() {
  const { plans, growers } = await getAllocationData();

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Target className="w-7 h-7 text-sprout-700" />
          <h1 className="text-3xl font-black text-text-primary tracking-tight">
            Allocate Tasks
          </h1>
        </div>
        <p className="text-text-secondary">
          Assign production plans to growers — {plans.length} plan
          {plans.length !== 1 ? "s" : ""} awaiting allocation ·{" "}
          {growers.length} active grower{growers.length !== 1 ? "s" : ""}
        </p>
      </div>

      <AllocateClient plans={plans} growers={growers} />
    </div>
  );
}
