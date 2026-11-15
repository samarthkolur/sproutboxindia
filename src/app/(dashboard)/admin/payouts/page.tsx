import { GlassCard } from "@/components/shared/GlassCard";
import { InvoiceLink, invoiceHref } from "@/components/shared/InvoiceLink";
import { CROP_DISPLAY_NAMES, type CropType } from "@/lib/constants";
import { rupees } from "@/lib/grower";
import { prisma } from "@/lib/prisma";
import { CreditCard, Clock, CheckCircle2 } from "lucide-react";
import { PayoutClient } from "./PayoutClient";

async function getPayouts() {
  try {
    return await prisma.payout.findMany({
      include: { grower: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  } catch { return []; }
}

// Delivered orders with where their money went, and the documents for each side of it.
async function getSettlements() {
  try {
    const orders = await prisma.order.findMany({
      where: { status: "DELIVERED", productionPlan: { isNot: null } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        restaurant: { select: { businessName: true } },
        productionPlan: {
          include: {
            tasks: {
              include: {
                grower: { include: { user: { select: { name: true } } } },
                batches: { select: { payout: { select: { amount: true } } } },
              },
            },
          },
        },
      },
    });
    return orders.map((order) => {
      const growers = (order.productionPlan?.tasks ?? []).map((task) => ({
        taskId: task.id,
        name: task.grower.user.name ?? "Grower",
        amount: task.batches.reduce((sum, b) => sum + (b.payout?.amount ?? 0), 0),
      }));
      const paidOut = growers.reduce((sum, g) => sum + g.amount, 0);
      return { order, growers, paidOut, share: order.totalPrice - paidOut };
    });
  } catch {
    return [];
  }
}

export default async function PayoutsPage() {
  const [payouts, settlements] = await Promise.all([getPayouts(), getSettlements()]);

  const totalPending = payouts.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const totalPaid = payouts.filter(p => p.status === "PAID").reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-1">
          <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-sprout-700 flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">Payouts</h1>
        </div>
        <p className="text-sm sm:text-base text-text-secondary">Manage grower payout processing</p>
      </div>

      <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-2">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">Pending</p>
              <p className="text-2xl font-black text-text-primary">₹{totalPending.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-sprout-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-sprout-600" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">Paid</p>
              <p className="text-2xl font-black text-text-primary">₹{totalPaid.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <PayoutClient initialPayouts={payouts} />

      {settlements.length > 0 ? (
        <section aria-labelledby="settlements-heading" className="mt-8">
          <h2 id="settlements-heading" className="mb-3 text-lg font-bold text-text-primary">Order settlements</h2>
          <div className="space-y-4">
            {settlements.map(({ order, growers, paidOut, share }) => (
              <GlassCard key={order.id}>
                <div className="flex flex-col gap-3 min-[640px]:flex-row min-[640px]:items-start min-[640px]:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {order.restaurant.businessName} · {order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-text-muted">
                      {CROP_DISPLAY_NAMES[order.cropType as CropType] ?? order.cropType}, {order.quantityKg} kg
                    </p>
                    <dl className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div><dt className="text-[11px] uppercase tracking-wider text-text-muted">Billed</dt><dd className="font-bold text-text-primary">{rupees(order.totalPrice)}</dd></div>
                      <div><dt className="text-[11px] uppercase tracking-wider text-text-muted">Growers</dt><dd className="font-bold text-text-primary">{rupees(paidOut)}</dd></div>
                      <div><dt className="text-[11px] uppercase tracking-wider text-text-muted">SproutBox</dt><dd className="font-bold text-sprout-800">{rupees(share)}</dd></div>
                    </dl>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <InvoiceLink href={invoiceHref.restaurant(order.id)} label="Restaurant invoice" size="sm" />
                    <InvoiceLink href={invoiceHref.platform(order.id)} label="Settlement" size="sm" />
                  </div>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2 border-t border-sprout-200/20 pt-3">
                  {growers.map((g) => (
                    <li key={g.taskId}>
                      <InvoiceLink
                        href={invoiceHref.grower(g.taskId)}
                        label={`${g.name} · ${rupees(g.amount)}`}
                        ariaLabel={`Download payout statement for ${g.name}`}
                        size="sm"
                      />
                    </li>
                  ))}
                </ul>
              </GlassCard>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
