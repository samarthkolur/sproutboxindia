const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const plan = await prisma.productionPlan.findFirst({
    include: { order: true }
  });
  if (!plan) return console.log('No plan found');
  const grower = await prisma.grower.findFirst();
  if (!grower) return console.log('No grower found');

  try {
    const notification = await prisma.notification.create({
      data: {
        userId: grower.userId,
        title: "New trays assigned 🌱",
        message: `You have been assigned 1 ${plan.order.cropType} tray to sow. Harvest by ${plan.harvestDate.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        })}.`,
        type: "TASK_ASSIGNED",
      },
    });
    console.log('Success:', notification);
  } catch (e) {
    console.error('Error during notification create:', e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
