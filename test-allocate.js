const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const plan = await prisma.productionPlan.findFirst({
    include: { order: true }
  });
  if (!plan) return console.log('No plan found');
  const grower = await prisma.grower.findFirst();
  if (!grower) return console.log('No grower found');

  console.log('Testing allocation with Plan:', plan.id, 'Grower:', grower.id);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          planId: plan.id,
          growerId: grower.id,
          cropType: plan.order.cropType,
          trayCount: 1,
          sowDate: plan.sowDate,
          harvestDate: plan.harvestDate,
          batches: {
            createMany: {
              data: [
                { trayNumber: 1 }
              ],
            },
          },
        },
        include: { batches: true },
      });
      return task;
    });
    console.log('Success:', result);
  } catch (e) {
    console.error('Error during transaction:', e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
