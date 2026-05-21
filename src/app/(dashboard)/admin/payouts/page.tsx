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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <CreditCard className="w-7 h-7 text-sprout-700" />
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Payouts</h1>
        </div>
        <p className="text-text-secondary">Manage grower payout processing</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
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
