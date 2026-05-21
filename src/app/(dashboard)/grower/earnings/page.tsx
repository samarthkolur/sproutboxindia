import { GlassCard } from "@/components/shared/GlassCard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Wallet, ArrowDownLeft, Clock } from "lucide-react";

async function getGrowerEarnings(userId: string) {
  try {
    const grower = await prisma.grower.findUnique({
      where: { userId },
      include: {
        payouts: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    return {
      totalEarnings: grower?.totalEarnings || 0,
      payouts: grower?.payouts || [],
    };
  } catch {
    return { totalEarnings: 0, payouts: [] };
  }
}

export default async function GrowerEarningsPage() {
  const session = await auth();
  const userId = session?.user?.id || "";
  const data = await getGrowerEarnings(userId);

  const statusColors: Record<string, string> = {
    PAID: "text-sprout-600 bg-sprout-50",
    PENDING: "text-amber-600 bg-amber-50",
    PROCESSING: "text-blue-600 bg-blue-50",
    FAILED: "text-red-600 bg-red-50",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">Earnings</h1>
        <p className="text-text-secondary mt-1">Track your payouts and total earnings</p>
      </div>

      {/* Total earnings card */}
      <GlassCard className="mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-sprout-600 to-sprout-800 rounded-2xl flex items-center justify-center shadow-lg shadow-sprout-800/20">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-text-muted font-medium">Total Earnings</p>
            <p className="text-3xl font-black text-text-primary tracking-tight">
              ₹{data.totalEarnings.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Payout history */}
      <GlassCard>
        <h2 className="text-lg font-bold text-text-primary mb-5">Payout History</h2>
        {data.payouts.length > 0 ? (
          <div className="space-y-3">
            {data.payouts.map((payout) => (
              <div
                key={payout.id}
            className="flex flex-col gap-3 rounded-xl border border-white/40 bg-white/50 p-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:gap-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  payout.status === "PAID" ? "bg-sprout-100" : "bg-amber-100"
                }`}>
                  {payout.status === "PAID" ? (
                    <ArrowDownLeft className="w-5 h-5 text-sprout-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">
                    Batch Payout
                  </p>
                  <p className="text-xs text-text-muted">
                    {payout.createdAt.toLocaleDateString("en-IN", {
                      month: "short", day: "numeric", year: "numeric"
                    })}
                  </p>
                </div>
                <div className="min-[420px]:text-right">
                  <p className="text-sm font-bold text-text-primary">
                    ₹{payout.amount.toLocaleString("en-IN")}
                  </p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[payout.status] || "text-text-muted bg-gray-50"}`}>
                    {payout.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Wallet className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">No payouts yet</h3>
            <p className="text-sm text-text-muted">
              Earnings from completed and QC-passed batches will appear here
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
