import { GlassCard } from "@/components/shared/GlassCard";
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

export default async function PayoutsPage() {
  const payouts = await getPayouts();

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
    </div>
  );
}
