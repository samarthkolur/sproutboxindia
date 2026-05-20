import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { addDays, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("admin123", 12);

  const cluster = await prisma.cluster.upsert({
    where: { id: "bangalore-koramangala" },
    update: {},
    create: {
      id: "bangalore-koramangala",
      name: "Koramangala Cluster",
      city: "Bangalore",
      lat: 12.9352,
      lng: 77.6245,
      radiusKm: 3,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@sproutbox.com" },
    update: {},
    create: { email: "admin@sproutbox.com", name: "SproutBox Admin", role: "ADMIN", passwordHash },
  });

  const hub = await prisma.hub.upsert({
    where: { id: "koramangala-hub" },
    update: {},
    create: {
      id: "koramangala-hub",
      name: "Koramangala Hub",
      address: "5th Block, Koramangala, Bangalore",
      clusterId: cluster.id,
      lat: 12.9352,
      lng: 77.6245,
      dropoffStart: "08:00",
      dropoffEnd: "11:00",
    },
  });

  for (let index = 1; index <= 5; index += 1) {
    await prisma.user.upsert({
      where: { email: `grower${index}@sproutbox.com` },
      update: {},
      create: {
        email: `grower${index}@sproutbox.com`,
        name: `Demo Grower ${index}`,
        role: "GROWER",
        passwordHash,
        grower: {
          create: {
            phone: `900000000${index}`,
            address: `${index} Green Street`,
            city: "Bangalore",
            pincode: "560034",
            clusterId: cluster.id,
            kitSize: index <= 2 ? 15 : 5,
            compositeScore: 0.5 + index * 0.07,
            qualityScore: 0.65 + index * 0.04,
            yieldScore: 0.6 + index * 0.04,
            timelinessScore: 0.7,
          },
        },
      },
    });
  }

  const restaurantNames = ["The Green Bowl", "Fresh Fare Kitchen"];
  for (let index = 0; index < restaurantNames.length; index += 1) {
    const name = restaurantNames[index];
    await prisma.user.upsert({
      where: { email: `restaurant${index + 1}@sproutbox.com` },
      update: {},
      create: {
        email: `restaurant${index + 1}@sproutbox.com`,
        name,
        role: "RESTAURANT",
        passwordHash,
        restaurant: {
          create: {
            businessName: name,
            contactName: name,
            phone: `988000000${index}`,
            address: `${index + 1} Kitchen Road`,
            city: "Bangalore",
            pincode: "560034",
            cuisineType: "Healthy",
          },
        },
      },
    });
  }

  const restaurant = await prisma.restaurant.findFirstOrThrow();
  const grower = await prisma.grower.findFirstOrThrow();

  for (const cropType of ["sunflower", "radish", "pea-shoots"]) {
    const order = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        cropType,
        quantityKg: 2,
        deliveryDate: addDays(new Date(), 7),
        status: "IN_PRODUCTION",
        totalPrice: 900,
      },
    });

    const plan = await prisma.productionPlan.create({
      data: {
        orderId: order.id,
        totalKg: 2,
        totalTrays: 13,
        bufferTrays: 3,
        sowDate: subDays(new Date(), 2),
        harvestDate: addDays(new Date(), 6),
        status: "ACTIVE",
      },
    });

    await prisma.task.create({
      data: {
        planId: plan.id,
        growerId: grower.id,
        cropType,
        trayCount: 3,
        sowDate: plan.sowDate,
        harvestDate: plan.harvestDate,
        status: "IN_PROGRESS",
        batches: { createMany: { data: [{ trayNumber: 1, currentDay: 2, status: "GROWING" }, { trayNumber: 2, currentDay: 2, status: "GROWING" }, { trayNumber: 3, currentDay: 2, status: "GROWING" }] } },
      },
    });
  }

  await prisma.delivery.create({
    data: {
      orderId: (await prisma.order.findFirstOrThrow()).id,
      hubId: hub.id,
      status: "PREPARING",
    },
  }).catch(() => undefined);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
