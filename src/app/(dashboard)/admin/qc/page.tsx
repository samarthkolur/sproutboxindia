import { GlassCard } from "@/components/shared/GlassCard";
import { prisma } from "@/lib/prisma";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { QCClient } from "./QCClient";

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

      <QCClient initialQueue={queue as any} />
    </div>
  );
}
