import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plan = await prisma.productionPlan.findFirst({
    include: { order: true }
  });

  if (!plan) {
    console.log("No plan found");
    return;
  }

  const grower = await prisma.grower.findFirst();

  if (!grower) {
    console.log("No grower found");
    return;
  }

  console.log("Testing with plan:", plan.id, "and grower:", grower.id);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          planId: plan.id,
          growerId: grower.id,
          cropType: plan.order.cropType,
          trayCount: 2,
          sowDate: plan.sowDate,
          harvestDate: plan.harvestDate,
          batches: {
            createMany: {
              data: Array.from({ length: 2 }, (_, index) => ({
                trayNumber: index + 1,
              })),
            },
          },
        },
        include: { batches: true },
      });
      
      // We will rollback intentionally to not pollute the DB
      throw new Error("ROLLBACK_SUCCESS: Task created successfully!");
    });
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
