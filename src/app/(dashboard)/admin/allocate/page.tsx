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
              // Fetch restaurant lat/lng for proximity scoring
              restaurant: {
                select: {
                  businessName: true,
                  city: true,
                  lat: true,
                  lng: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.grower.findMany({
        where: { isActive: true },
        include: {
          user: { select: { name: true } },
          _count: { select: { tasks: { where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } } } } },
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
        activeTasks: g._count.tasks,
        lat: g.lat,
        lng: g.lng,
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
          Assign production plans to growers — nearby growers get priority ·{" "}
          {plans.length} plan{plans.length !== 1 ? "s" : ""} awaiting ·{" "}
          {growers.length} active grower{growers.length !== 1 ? "s" : ""}
        </p>
      </div>

      <AllocateClient plans={plans} growers={growers} />
    </div>
  );
}
