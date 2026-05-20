import { notFound } from "next/navigation";
import { DeliveryTracker } from "@/components/restaurant/DeliveryTracker";
import { GlassCard } from "@/components/shared/GlassCard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function RestaurantOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const order = await prisma.order.findFirst({
    where: { id: params.id, restaurant: { userId: session?.user?.id } },
    include: { delivery: true, productionPlan: true },
  });

  if (!order) notFound();

  return (
    <div className="space-y-6">
      <GlassCard>
        <h1 className="text-2xl font-black text-text-primary">Order {order.id.slice(0, 8).toUpperCase()}</h1>
        <p className="mt-2 text-text-muted">{order.cropType} · {order.quantityKg}kg · {formatCurrency(order.totalPrice)}</p>
        <p className="text-sm text-text-muted">Delivery {formatDate(order.deliveryDate)}</p>
      </GlassCard>
      <GlassCard>
        <h2 className="mb-4 font-bold text-text-primary">Delivery status</h2>
        <DeliveryTracker status={order.delivery?.status || order.status} />
      </GlassCard>
    </div>
  );
}
