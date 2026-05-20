import { GlassCard } from "@/components/shared/GlassCard";
import { prisma } from "@/lib/prisma";
import { CreditCard, Clock, CheckCircle2, ArrowDownLeft } from "lucide-react";

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

      {payouts.length > 0 ? (
        <GlassCard>
          <h2 className="text-lg font-bold text-text-primary mb-5">Recent Payouts</h2>
          <div className="space-y-3">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center gap-4 bg-white/50 rounded-xl p-4 border border-white/40 row-hover">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.status === "PAID" ? "bg-sprout-100" : "bg-amber-100"}`}>
                  {p.status === "PAID" ? <ArrowDownLeft className="w-5 h-5 text-sprout-600" /> : <Clock className="w-5 h-5 text-amber-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">{p.grower.user.name}</p>
                  <p className="text-xs text-text-muted">{p.createdAt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-text-primary">₹{p.amount.toLocaleString("en-IN")}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.status === "PAID" ? "bg-sprout-50 text-sprout-700" : "bg-amber-50 text-amber-700"}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : (
        <GlassCard>
          <div className="text-center py-16">
            <CreditCard className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">No payouts</h3>
            <p className="text-sm text-text-muted">Payouts will be generated when batches pass QC</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
