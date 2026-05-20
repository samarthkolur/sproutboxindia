import { notFound } from "next/navigation";
import { QCReviewPanel } from "@/components/admin/QCReviewPanel";
import { GlassCard } from "@/components/shared/GlassCard";
import { prisma } from "@/lib/prisma";

export default async function AdminBatchQCPage({ params }: { params: { batchId: string } }) {
  const batch = await prisma.batch.findUnique({
    where: { id: params.batchId },
    include: { checkIns: { orderBy: { createdAt: "desc" }, take: 1 }, task: { include: { grower: { include: { user: true } } } } },
  });

  if (!batch) notFound();
  const latest = batch.checkIns[0];

  return (
    <div className="space-y-6">
      <GlassCard>
        <h1 className="text-2xl font-black text-text-primary">QC Review</h1>
        <p className="mt-2 text-text-muted">{batch.task.cropType} · {batch.task.grower.user.name || "Grower"} · Tray {batch.trayNumber}</p>
      </GlassCard>
      <QCReviewPanel batchId={batch.id} checkInId={latest?.id || ""} />
    </div>
  );
}
