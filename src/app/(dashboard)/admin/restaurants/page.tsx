import { GlassCard } from "@/components/shared/GlassCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { prisma } from "@/lib/prisma";

export default async function AdminRestaurantsPage() {
  const restaurants = await prisma.restaurant.findMany({ include: { user: true, orders: true }, orderBy: { businessName: "asc" } });

  return (
    <div>
      <h1 className="mb-6 text-3xl font-black text-text-primary">Restaurants</h1>
      {restaurants.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {restaurants.map((restaurant) => (
            <GlassCard key={restaurant.id}>
              <h2 className="font-bold text-text-primary">{restaurant.businessName}</h2>
              <p className="text-sm text-text-muted">{restaurant.city} · {restaurant.orders.length} orders</p>
              <p className="mt-2 text-sm text-text-muted">{restaurant.contactName} · {restaurant.phone}</p>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState title="No restaurants yet" description="Restaurant accounts will appear after partner onboarding." />
      )}
    </div>
  );
}
