import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { prisma } from "@/lib/prisma";
import { shortId } from "@/lib/admin";
import { BatchReview } from "./BatchReview";

// One tray, with its whole check-in history. The queue links here, so does a notification.
export default async function AdminBatchQCPage({ params }: { params: { batchId: string } }) {
  const batch = await prisma.batch.findUnique({
    where: { id: params.batchId },
    include: {
      checkIns: { orderBy: { createdAt: "desc" } },
      task: { select: { cropType: true, grower: { select: { user: { select: { name: true } } } } } },
    },
  });
  if (!batch) notFound();

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-ink-muted">
        <Link href="/admin/qc" className="rounded hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
          QC review
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span aria-current="page" className="font-medium text-ink">{`Tray ${shortId(batch.id)}`}</span>
      </nav>
      <PageHeader title="Review tray" subtitle={`Tray ${batch.trayNumber}, day ${batch.currentDay}`} />
      <Panel className="max-w-4xl">
        <BatchReview
          item={{
            batchId: batch.id,
            trayNumber: batch.trayNumber,
            cropType: batch.task.cropType,
            growerName: batch.task.grower.user.name ?? "Grower",
            reviewable: batch.status === "QC_PENDING",
            checkIns: batch.checkIns.map((c) => ({
              id: c.id,
              day: c.day,
              imageTopUrl: c.imageTopUrl,
              imageSideUrl: c.imageSideUrl,
              notes: c.notes,
              qcResult: c.qcResult,
              qcNotes: c.qcNotes,
              createdAt: c.createdAt.toISOString(),
            })),
          }}
        />
      </Panel>
    </>
  );
}
