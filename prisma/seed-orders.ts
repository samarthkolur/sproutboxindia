import { createHash } from "node:crypto";
import { BatchStatus, Prisma, PrismaClient } from "@prisma/client";

// Two orders taken all the way through the pipeline, to the state the real flow leaves
// behind: placed, planned, allocated, grown, checked, harvested, packed, delivered,
// reviewed, and the growers paid. Every row follows the same rules as the API routes.
//
//   npx tsx prisma/seed-orders.ts            add the orders (skips ones already present)
//   npx tsx prisma/seed-orders.ts --reset    remove exactly the rows this script adds
//
// It uses the five grower accounts and the first restaurant from prisma/seed.ts, and
// never touches any other account or order.

const prisma = new PrismaClient();

/** Same shape as the ids the app creates (a "cm" cuid), derived from a name so a re-run finds its own rows. */
const cid = (seed: string) => "cm" + createHash("sha256").update(seed).digest("base64url").replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 23);
// Notifications are never shown by id, so their ids carry a prefix that --reset can match.
const NOTE = "sbn_";
const PRICE_PER_KG: Record<string, number> = { sunflower: 450, "pea-shoots": 380 };
const PAYOUT_PER_TRAY = 50;
const TRAY_YIELD_GRAMS = 200;
const BUFFER = 0.25;

/** A wall-clock time in India, e.g. at("2026-10-13", "11:20"). */
const at = (day: string, time = "09:00") => new Date(`${day}T${time}:00+05:30`);
const dayOnly = (day: string) => new Date(`${day}T00:00:00.000Z`);

// ── The people ───────────────────────────────────────────────────────────────

const GROWERS = [
  { email: "grower1@sproutbox.com", name: "Lakshmi Venkatesh", phone: "9000000001", address: "27, 4th Cross, 4th Block, Koramangala", pincode: "560034", space: 60 },
  { email: "grower2@sproutbox.com", name: "Suresh Gowda", phone: "9000000002", address: "112, 14th Main, Sector 6, HSR Layout", pincode: "560102", space: 60 },
  { email: "grower3@sproutbox.com", name: "Anitha Reddy", phone: "9000000003", address: "9, 1st Cross, Jakkasandra Extension, Koramangala", pincode: "560034", space: 30 },
  { email: "grower4@sproutbox.com", name: "Meera Krishnan", phone: "9000000004", address: "51, 7th Main, 2nd Block, Jayanagar", pincode: "560011", space: 25 },
  { email: "grower5@sproutbox.com", name: "Prakash Nayak", phone: "9000000005", address: "33, 80 Feet Road, 6th Block, Koramangala", pincode: "560095", space: 25 },
] as const;

const RESTAURANT = {
  email: "restaurant1@sproutbox.com",
  contact: "Arjun Mehta",
  phone: "9000000021",
  address: "14, 80 Feet Road, 5th Block, Koramangala",
  pincode: "560095",
  cuisine: "Modern Indian",
  lat: 12.9345,
  lng: 77.6193,
};
const RESTAURANT2 = { email: "restaurant2@sproutbox.com", contact: "Nisha Rao", phone: "9000000022", address: "6, 12th Main, Indiranagar", pincode: "560038", cuisine: "Cafe and bakery" };

// ── The two orders ───────────────────────────────────────────────────────────

interface TrayPlan {
  trays: number;
  rejected: number;
}

interface OrderSpec {
  key: string;
  crop: "sunflower" | "pea-shoots";
  kg: number;
  cycleDays: number;
  photoDays: number[]; // days a grower uploads photos
  qcDay: number; // the check-in the reviewer signs off
  created: [string, string];
  deliveryDate: string;
  planCreated: [string, string];
  sow: string;
  harvest: string; // planned harvest date (delivery - 1)
  seeds: [string, string]; // seed trays delivered to the growers
  qcAt: [string, string];
  harvestedAt: [string, string];
  hubAt: [string, string];
  packedAt: [string, string];
  dispatchedAt: [string, string];
  deliveredAt: [string, string];
  paidAt: [string, string];
  split: Record<string, TrayPlan>; // by grower email
  rejectNotes: string[];
  feedback: { rating: number; at: [string, string]; notes: string };
  driver: { name: string; phone: string };
}

const ORDERS: OrderSpec[] = [
  {
    key: "sf1",
    crop: "sunflower",
    kg: 3,
    cycleDays: 9,
    photoDays: [3, 6, 8],
    qcDay: 8,
    created: ["2026-10-13", "11:20"],
    deliveryDate: "2026-10-25",
    planCreated: ["2026-10-13", "15:05"],
    sow: "2026-10-14",
    harvest: "2026-10-24",
    seeds: ["2026-10-14", "09:30"],
    qcAt: ["2026-10-22", "10:10"],
    harvestedAt: ["2026-10-23", "09:15"],
    hubAt: ["2026-10-24", "07:30"],
    packedAt: ["2026-10-24", "17:30"],
    dispatchedAt: ["2026-10-25", "09:00"],
    deliveredAt: ["2026-10-25", "10:40"],
    paidAt: ["2026-10-28", "16:00"],
    split: {
      "grower1@sproutbox.com": { trays: 8, rejected: 0 },
      "grower2@sproutbox.com": { trays: 7, rejected: 1 },
      "grower3@sproutbox.com": { trays: 4, rejected: 1 },
    },
    rejectNotes: ["Patchy germination and uneven height across the tray.", "Sparse coverage and seed-coat residue, below the density we supply."],
    feedback: {
      rating: 5,
      at: ["2026-10-25", "19:40"],
      notes: "Tags: Freshness, Quality\nThe sunflower shoots were crisp and nutty. They went straight onto our tasting menu and the kitchen wants them weekly.",
    },
    driver: { name: "Ravi Kumar", phone: "9000000031" },
  },
  {
    key: "ps1",
    crop: "pea-shoots",
    kg: 3.5,
    cycleDays: 8,
    photoDays: [3, 6, 7],
    qcDay: 7,
    created: ["2026-10-23", "16:05"],
    deliveryDate: "2026-11-05",
    planCreated: ["2026-10-24", "10:30"],
    sow: "2026-10-25",
    harvest: "2026-11-04",
    seeds: ["2026-10-25", "09:15"],
    qcAt: ["2026-11-01", "10:00"],
    harvestedAt: ["2026-11-02", "09:30"],
    hubAt: ["2026-11-03", "07:45"],
    packedAt: ["2026-11-04", "17:45"],
    dispatchedAt: ["2026-11-05", "09:00"],
    deliveredAt: ["2026-11-05", "10:50"],
    paidAt: ["2026-11-09", "16:00"],
    split: {
      "grower1@sproutbox.com": { trays: 10, rejected: 1 },
      "grower2@sproutbox.com": { trays: 8, rejected: 1 },
      "grower3@sproutbox.com": { trays: 5, rejected: 1 },
    },
    rejectNotes: ["Mould spotting along the tray edge. Not fit for supply.", "Weak, yellowing stems after the cover came off.", "Thin growth in one corner; yield too low."],
    feedback: {
      rating: 4,
      at: ["2026-11-05", "20:10"],
      notes: "Tags: Quality, Packaging\nVery good pea shoots, sweet and tender. The boxes could be a little sturdier for the morning run.",
    },
    driver: { name: "Ravi Kumar", phone: "9000000031" },
  },
];

const YIELDS = [196, 204, 198, 210, 201, 207, 195, 203, 199, 206, 202, 197];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function reset() {
  const orders = ORDERS.map((o) => cid(`order:${o.key}`));
  const plans = (await prisma.productionPlan.findMany({ where: { orderId: { in: orders } }, select: { id: true } })).map((p) => p.id);
  const tasks = (await prisma.task.findMany({ where: { planId: { in: plans } }, select: { id: true } })).map((t) => t.id);
  const batches = (await prisma.batch.findMany({ where: { taskId: { in: tasks } }, select: { id: true } })).map((b) => b.id);
  await prisma.notification.deleteMany({ where: { id: { startsWith: NOTE } } });
  // Rows from an earlier version of this script, which used a readable id prefix.
  const old = { startsWith: "sb_" };
  await prisma.notification.deleteMany({ where: { id: old } });
  await prisma.feedback.deleteMany({ where: { id: old } });
  await prisma.payout.deleteMany({ where: { id: old } });
  await prisma.checkIn.deleteMany({ where: { id: old } });
  await prisma.batch.deleteMany({ where: { id: old } });
  await prisma.task.deleteMany({ where: { id: old } });
  await prisma.delivery.deleteMany({ where: { id: old } });
  await prisma.productionPlan.deleteMany({ where: { id: old } });
  await prisma.order.deleteMany({ where: { id: old } });
  await prisma.feedback.deleteMany({ where: { orderId: { in: orders } } });
  await prisma.payout.deleteMany({ where: { batchId: { in: batches } } });
  await prisma.checkIn.deleteMany({ where: { batchId: { in: batches } } });
  await prisma.batch.deleteMany({ where: { id: { in: batches } } });
  await prisma.task.deleteMany({ where: { id: { in: tasks } } });
  await prisma.delivery.deleteMany({ where: { orderId: { in: orders } } });
  await prisma.productionPlan.deleteMany({ where: { id: { in: plans } } });
  await prisma.order.deleteMany({ where: { id: { in: orders } } });
  await prisma.grower.updateMany({
    where: { user: { email: { in: GROWERS.map((g) => g.email) } } },
    data: { totalEarnings: 0, yieldScore: 0.5, qualityScore: 0.5, timelinessScore: 0.5, compositeScore: 0.5 },
  });
  console.log("Removed the orders added by this script.");
}

async function people() {
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@sproutbox.com" } });
  const hub = await prisma.hub.findFirstOrThrow({ where: { isActive: true } });

  const growers = new Map<string, { id: string; userId: string }>();
  for (const g of GROWERS) {
    const user = await prisma.user.update({ where: { email: g.email }, data: { name: g.name } });
    const grower = await prisma.grower.update({
      where: { userId: user.id },
      data: {
        phone: g.phone,
        address: g.address,
        pincode: g.pincode,
        spaceAvailable: g.space,
        upiId: `${g.phone}@ybl`,
      },
    });
    growers.set(g.email, { id: grower.id, userId: user.id });
  }

  const ruser = await prisma.user.update({ where: { email: RESTAURANT.email }, data: { name: RESTAURANT.contact } });
  const restaurant = await prisma.restaurant.update({
    where: { userId: ruser.id },
    data: {
      contactName: RESTAURANT.contact,
      phone: RESTAURANT.phone,
      address: RESTAURANT.address,
      pincode: RESTAURANT.pincode,
      cuisineType: RESTAURANT.cuisine,
      lat: RESTAURANT.lat,
      lng: RESTAURANT.lng,
    },
  });
  const r2 = await prisma.user.update({ where: { email: RESTAURANT2.email }, data: { name: RESTAURANT2.contact } });
  await prisma.restaurant.update({
    where: { userId: r2.id },
    data: { contactName: RESTAURANT2.contact, phone: RESTAURANT2.phone, address: RESTAURANT2.address, pincode: RESTAURANT2.pincode, cuisineType: RESTAURANT2.cuisine },
  });

  return { admin, hub, growers, restaurant, restaurantUserId: ruser.id };
}

type People = Awaited<ReturnType<typeof people>>;

async function placeOrder(spec: OrderSpec, ctx: People) {
  const orderId = cid(`order:${spec.key}`);
  if (await prisma.order.findUnique({ where: { id: orderId } })) {
    console.log(`Order ${spec.key} is already there, skipping.`);
    return;
  }

  const totalPrice = Math.round(spec.kg * PRICE_PER_KG[spec.crop]);
  const baseTrays = Math.ceil((spec.kg * 1000) / TRAY_YIELD_GRAMS);
  const bufferTrays = Math.ceil(baseTrays * BUFFER);
  const totalTrays = baseTrays + bufferTrays;
  const allocated = Object.values(spec.split).reduce((sum, s) => sum + s.trays, 0);
  if (allocated !== totalTrays) throw new Error(`${spec.key}: ${allocated} trays allocated, plan needs ${totalTrays}`);

  const photo = spec.crop === "sunflower" ? "/sunflower.png" : "/pea-shoots.png";
  const created = at(...spec.created);
  const notifications: Prisma.NotificationCreateManyInput[] = [];
  const checkIns: { id: string; batchId: string; day: number; imageTopUrl: string; imageSideUrl: string; notes: string | null; qcResult: "PASS" | "REJECT" | null; qcNotes: string | null; qcReviewedAt: Date | null; qcReviewedBy: string | null; createdAt: Date }[] = [];
  const batches: { id: string; taskId: string; trayNumber: number; currentDay: number; status: BatchStatus; actualYieldGrams: number | null; harvestImageUrl: string | null; harvestedAt: Date | null; createdAt: Date }[] = [];
  const payouts: { id: string; growerId: string; batchId: string; amount: number; status: "PAID"; paidAt: Date; createdAt: Date }[] = [];

  await prisma.order.create({
    data: {
      id: orderId,
      restaurantId: ctx.restaurant.id,
      cropType: spec.crop,
      quantityKg: spec.kg,
      deliveryDate: dayOnly(spec.deliveryDate),
      status: "DELIVERED",
      totalPrice,
      createdAt: created,
      updatedAt: at(...spec.deliveredAt),
    },
  });

  const planId = cid(`plan:${spec.key}`);
  await prisma.productionPlan.create({
    data: {
      id: planId,
      orderId,
      totalKg: spec.kg,
      totalTrays,
      bufferTrays,
      bufferPercent: BUFFER,
      sowDate: dayOnly(spec.sow),
      harvestDate: dayOnly(spec.harvest),
      status: "ACTIVE",
      createdAt: at(...spec.planCreated),
    },
  });

  const allocatedAt = at(spec.planCreated[0], "16:10");
  const harvestedAt = at(...spec.harvestedAt);
  const qcAt = at(...spec.qcAt);
  let rejectIndex = 0;
  let yieldIndex = 0;

  for (const [email, plan] of Object.entries(spec.split)) {
    const grower = ctx.growers.get(email)!;
    const tag = email.slice(0, 7); // growerN
    const taskId = cid(`task:${spec.key}:${tag}`);
    const harvestedCount = plan.trays - plan.rejected;

    await prisma.task.create({
      data: {
        id: taskId,
        planId,
        growerId: grower.id,
        cropType: spec.crop,
        trayCount: plan.trays,
        sowDate: dayOnly(spec.sow),
        harvestDate: dayOnly(spec.harvest),
        status: "HARVESTED",
        allocatedAt,
      },
    });

    notifications.push(
      { id: `${NOTE}${taskId}_assigned`, userId: grower.userId, title: "New trays assigned 🌱", message: `You have been assigned ${plan.trays} ${spec.crop} trays to sow. Harvest by ${at(spec.harvest).toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" })}.`, type: "TASK_ASSIGNED", read: true, createdAt: allocatedAt },
      { id: `${NOTE}${taskId}_seeds`, userId: grower.userId, title: "Seeds & Trays Delivered", message: `Your supplies for ${plan.trays} trays of ${spec.crop} have been delivered. You can now start growing!`, type: "SUPPLIES_DELIVERED", read: true, createdAt: at(...spec.seeds) },
      { id: `${NOTE}${taskId}_qc`, userId: grower.userId, title: "Batch passed QC ✅", message: `${harvestedCount} of ${plan.trays} trays passed quality review. Ready to harvest!`, type: "QC_RESULT", read: true, createdAt: qcAt },
      { id: `${NOTE}${taskId}_payout`, userId: grower.userId, title: "Payout queued", message: `Payout of ₹${harvestedCount * PAYOUT_PER_TRAY} queued for ${harvestedCount} trays of ${spec.crop}.`, type: "PAYOUT", read: true, createdAt: harvestedAt },
    );
    // The admin hears about the pickup; the restaurant hears its order is ready.
    notifications.push({ id: `${NOTE}${taskId}_pickup`, userId: ctx.admin.id, title: "Pickup Requested", message: `Grower ${grower.id.slice(0, 5)} requested pickup for ${plan.trays} trays of ${spec.crop}.`, type: "pickup_ready", read: true, createdAt: at(spec.qcAt[0], "18:20") });
    if (email === Object.keys(spec.split)[0]) {
      notifications.push({ id: `${NOTE}${orderId}_ready`, userId: ctx.restaurantUserId, title: "Your Microgreens are Ready!", message: `Your order for ${spec.crop} is ready and will be delivered today.`, type: "order_ready", read: true, createdAt: at(spec.deliveredAt[0], "08:15") });
    }

    for (let n = 1; n <= plan.trays; n += 1) {
      const rejected = n > harvestedCount; // the last trays of each task are the rejected ones
      const batchId = cid(`batch:${spec.key}:${tag}:${n}`);
      const yieldGrams = rejected ? null : YIELDS[yieldIndex++ % YIELDS.length];
      batches.push({
        id: batchId,
        taskId,
        trayNumber: n,
        currentDay: spec.cycleDays,
        status: rejected ? BatchStatus.REJECTED : BatchStatus.HARVESTED,
        actualYieldGrams: yieldGrams,
        harvestImageUrl: rejected ? null : photo,
        harvestedAt: rejected ? null : new Date(harvestedAt.getTime() + n * 4 * 60 * 1000),
        createdAt: allocatedAt,
      });

      for (const day of spec.photoDays) {
        const finalCheck = day === spec.qcDay;
        const checkedAt = at(new Date(dayOnly(spec.sow).getTime() + (day - 1) * 86400000).toISOString().slice(0, 10), `${String(8 + (n % 3)).padStart(2, "0")}:${String(10 + ((n * 7) % 40)).padStart(2, "0")}`);
        checkIns.push({
          id: cid(`checkin:${batchId}:${day}`),
          batchId,
          day,
          imageTopUrl: photo,
          imageSideUrl: photo,
          notes: null,
          qcResult: finalCheck ? (rejected ? "REJECT" : "PASS") : null,
          qcNotes: finalCheck && rejected ? spec.rejectNotes[rejectIndex % spec.rejectNotes.length] : null,
          qcReviewedAt: finalCheck ? qcAt : null,
          qcReviewedBy: finalCheck ? ctx.admin.id : null,
          createdAt: checkedAt,
        });
      }
      if (rejected) {
        notifications.push({ id: `${NOTE}${batchId}_rej`, userId: grower.userId, title: "Batch rejected ❌", message: `Tray #${n} did not pass quality review. Admin note: ${spec.rejectNotes[rejectIndex % spec.rejectNotes.length]}`, type: "QC_RESULT", read: true, createdAt: qcAt });
        rejectIndex += 1;
      } else {
        payouts.push({ id: cid(`payout:${batchId}`), growerId: grower.id, batchId, amount: PAYOUT_PER_TRAY, status: "PAID", paidAt: at(...spec.paidAt), createdAt: harvestedAt });
      }
    }
  }

  await prisma.batch.createMany({ data: batches });
  await prisma.checkIn.createMany({ data: checkIns });
  await prisma.payout.createMany({ data: payouts });

  await prisma.delivery.create({
    data: {
      id: cid(`delivery:${spec.key}`),
      orderId,
      hubId: ctx.hub.id,
      status: "DELIVERED",
      driverName: spec.driver.name,
      driverPhone: spec.driver.phone,
      packedAt: at(...spec.packedAt),
      dispatchedAt: at(...spec.dispatchedAt),
      deliveredAt: at(...spec.deliveredAt),
      createdAt: at(...spec.hubAt),
    },
  });

  await prisma.feedback.create({
    data: {
      id: cid(`feedback:${spec.key}`),
      orderId,
      restaurantId: ctx.restaurant.id,
      rating: spec.feedback.rating,
      notes: spec.feedback.notes,
      createdAt: at(...spec.feedback.at),
    },
  });

  await prisma.notification.createMany({ data: notifications });
  console.log(`Order ${spec.key}: ₹${totalPrice}, ${totalTrays} trays, ${payouts.length} paid out (₹${payouts.length * PAYOUT_PER_TRAY}).`);
}

/** Totals and scores for each grower, from the rows that exist now (same definitions as the app). */
async function settleGrowers(ctx: People) {
  for (const [email, grower] of Array.from(ctx.growers.entries())) {
    const mine = await prisma.batch.findMany({
      where: { task: { growerId: grower.id, plan: { orderId: { in: ORDERS.map((o) => cid(`order:${o.key}`)) } } } },
      include: { task: true },
    });
    const harvested = mine.filter((b) => b.status === BatchStatus.HARVESTED);
    if (mine.length === 0) continue;
    const earned = await prisma.payout.aggregate({ where: { growerId: grower.id, batch: { task: { plan: { orderId: { in: ORDERS.map((o) => cid(`order:${o.key}`)) } } } } }, _sum: { amount: true } });

    const yieldScore = harvested.reduce((sum, b) => sum + Math.min((b.actualYieldGrams ?? 0) / TRAY_YIELD_GRAMS, 1), 0) / harvested.length;
    const qualityScore = harvested.length / mine.length;
    const onTime = harvested.filter((b) => b.harvestedAt && b.harvestedAt <= b.task.harvestDate).length / harvested.length;
    const r = (n: number) => Math.round(n * 100) / 100;
    await prisma.grower.update({
      where: { id: grower.id },
      data: {
        totalEarnings: earned._sum.amount ?? 0,
        yieldScore: r(yieldScore),
        qualityScore: r(qualityScore),
        timelinessScore: r(onTime),
        compositeScore: r(yieldScore * 0.4 + qualityScore * 0.4 + onTime * 0.2),
      },
    });
    console.log(`${email}: ₹${earned._sum.amount ?? 0} earned, quality ${r(qualityScore)}.`);
  }
}

async function main() {
  if (process.argv.includes("--reset")) return reset();
  const ctx = await people();
  for (const spec of ORDERS) await placeOrder(spec, ctx);
  await settleGrowers(ctx);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
