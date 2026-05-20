import { GlassCard } from "@/components/shared/GlassCard";
import { prisma } from "@/lib/prisma";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

async function getQCQueue() {
  try {
    return await prisma.checkIn.findMany({
      where: { qcResult: null },
      include: { batch: { include: { task: { include: { grower: { include: { user: { select: { name: true } } } } } } } } },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
  } catch { return []; }
}

export default async function QCReviewPage() {
  const queue = await getQCQueue();

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <CheckCircle2 className="w-7 h-7 text-sprout-700" />
          <h1 className="text-3xl font-black text-text-primary tracking-tight">QC Review</h1>
        </div>
        <p className="text-text-secondary">Review grower check-in photos and approve quality</p>
      </div>

      {queue.length > 0 ? (
        <div className="space-y-4">
          {queue.map((checkin) => (
            <GlassCard key={checkin.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {checkin.batch.task.grower.user.name} — Day {checkin.day}
                  </p>
                  <p className="text-xs text-text-muted">
                    {checkin.batch.task.cropType} · Tray #{checkin.batch.trayNumber}
                  </p>
                </div>
                <p className="text-xs text-text-muted">
                  {checkin.createdAt.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                </p>
              </div>
              {checkin.notes && (
                <p className="text-sm text-text-secondary mb-4 bg-white/50 rounded-xl p-3 border border-white/40">{checkin.notes}</p>
              )}
              <div className="flex items-center gap-3">
                <button className="flex-1 bg-sprout-800 text-white py-2 rounded-xl text-sm font-semibold hover:bg-sprout-900 transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Pass
                </button>
                <button className="flex-1 bg-amber-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Risk
                </button>
                <button className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard>
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">QC queue clear</h3>
            <p className="text-sm text-text-muted">No check-ins pending quality review</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
