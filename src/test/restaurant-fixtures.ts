// Builders for the restaurant portal tests: just enough of a Prisma order to render a page.

const day = 24 * 60 * 60 * 1000;
export const NOW = new Date();
export const daysFromNow = (n: number) => new Date(NOW.getTime() + n * day);

export function order(overrides: Record<string, unknown> = {}) {
  return {
    id: "cmorder0001abcdef",
    restaurantId: "rest-1",
    cropType: "sunflower",
    quantityKg: 3,
    deliveryDate: daysFromNow(5),
    recurrence: null as string | null,
    status: "IN_PRODUCTION",
    totalPrice: 1350,
    stripePaymentId: null,
    notes: null as string | null,
    createdAt: daysFromNow(-4),
    updatedAt: daysFromNow(-4),
    delivery: null as Record<string, unknown> | null,
    feedback: null as Record<string, unknown> | null,
    productionPlan: { sowDate: daysFromNow(-3), harvestDate: daysFromNow(6), tasks: [{ batches: [{ currentDay: 3 }, { currentDay: 2 }] }] } as Record<string, unknown> | null,
    ...overrides,
  };
}

export const delivered = (overrides: Record<string, unknown> = {}) =>
  order({
    id: "cmdelivered01abcd",
    status: "DELIVERED",
    deliveryDate: daysFromNow(-5),
    createdAt: daysFromNow(-20),
    delivery: { status: "DELIVERED", packedAt: daysFromNow(-7), dispatchedAt: daysFromNow(-5), deliveredAt: daysFromNow(-5) },
    ...overrides,
  });

export const feedback = (overrides: Record<string, unknown> = {}) => ({
  id: "fb1",
  rating: 4,
  notes: "Tags: Quality, Packaging\nVery fresh",
  createdAt: daysFromNow(-4),
  ...overrides,
});
