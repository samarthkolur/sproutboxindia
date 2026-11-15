// Builders for the grower portal tests: just enough of a Prisma row to render a page.

export const NOW = new Date();
const day = 24 * 60 * 60 * 1000;
export const daysFromNow = (n: number) => new Date(NOW.getTime() + n * day);

export function batch(overrides: Record<string, unknown> = {}) {
  return {
    id: "batch-1",
    taskId: "task-1",
    trayNumber: 1,
    currentDay: 3,
    status: "GROWING",
    actualYieldGrams: null,
    harvestImageUrl: null,
    harvestedAt: null,
    createdAt: daysFromNow(-3),
    checkIns: [] as Record<string, unknown>[],
    payout: null,
    ...overrides,
  };
}

export function task(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    planId: "plan-1",
    growerId: "grower-1",
    cropType: "sunflower",
    trayCount: 5,
    sowDate: daysFromNow(-3),
    harvestDate: daysFromNow(6),
    status: "IN_PROGRESS",
    allocatedAt: daysFromNow(-4),
    batches: [batch()],
    ...overrides,
  };
}

export function grower(overrides: Record<string, unknown> = {}) {
  return {
    id: "grower-1",
    userId: "user-1",
    phone: "+919876543210",
    address: "12 MG Road",
    city: "Bengaluru",
    pincode: "560001",
    kitSize: 5,
    spaceAvailable: 40,
    bankAccount: "123456789012",
    bankIFSC: "HDFC0001234",
    upiId: "asha@upi",
    fssaiRegNumber: null,
    fssaiVerifiedAt: null,
    yieldScore: 0.8,
    qualityScore: 0.92,
    timelinessScore: 0.7,
    compositeScore: 0.8,
    totalEarnings: 0,
    isActive: true,
    joinedAt: daysFromNow(-60),
    user: { name: "Asha Rao", email: "asha@example.com" },
    tasks: [task()],
    ...overrides,
  };
}

export function payout(overrides: Record<string, unknown> = {}) {
  return {
    id: "payout-1",
    growerId: "grower-1",
    batchId: "batch-1",
    amount: 50,
    status: "PAID",
    paidAt: daysFromNow(-2),
    createdAt: daysFromNow(-3),
    batch: { trayNumber: 1, task: { id: "task-1", cropType: "sunflower" } },
    ...overrides,
  };
}
