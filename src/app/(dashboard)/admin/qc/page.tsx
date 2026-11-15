import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { QCClient, type QueueItem } from "./QCClient";

export default async function QCReviewPage() {
  const batches = await prisma.batch.findMany({
    where: { status: "QC_PENDING" },
    include: {
      task: { select: { cropType: true, grower: { select: { user: { select: { name: true } } } } } },
      checkIns: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const queue: QueueItem[] = batches.map((b) => ({
    batchId: b.id,
    trayNumber: b.trayNumber,
    cropType: b.task.cropType,
    growerName: b.task.grower.user.name ?? "Grower",
    reviewable: true,
    day: b.currentDay,
    waitingSince: (b.checkIns[0]?.createdAt ?? b.createdAt).toISOString(),
    checkIns: b.checkIns.map((c) => ({
      id: c.id,
      day: c.day,
      imageTopUrl: c.imageTopUrl,
      imageSideUrl: c.imageSideUrl,
      notes: c.notes,
      qcResult: c.qcResult,
      qcNotes: c.qcNotes,
      createdAt: c.createdAt.toISOString(),
    })),
  }));

  return (
    <>
      <PageHeader title="QC review" subtitle="Review each tray's photos and decide: pass it, flag a risk, or reject it with a reason." />
      <QCClient queue={queue} />
    </>
  );
}
