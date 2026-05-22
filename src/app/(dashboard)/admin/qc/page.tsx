import { prisma } from "@/lib/prisma";
import { CheckCircle2 } from "lucide-react";
import { QCClient } from "./QCClient";

async function getQCQueue() {
  try {
    // Fetch batches that are QC_PENDING — this is the correct approach
    // (checkin API sets batch status to QC_PENDING on final day)
    return await prisma.batch.findMany({
      where: { status: "QC_PENDING" },
      include: {
        task: {
          include: {
            grower: { include: { user: { select: { name: true } } } },
          },
        },
        checkIns: {
          orderBy: { day: "desc" },
          take: 1, // most recent check-in
        },
      },
      orderBy: { createdAt: "asc" },
      take: 30,
    });
  } catch {
    return [];
  }
}

export default async function QCReviewPage() {
  const queue = await getQCQueue();

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-1">
          <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-sprout-700 flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            QC Review
          </h1>
        </div>
        <p className="text-sm sm:text-base text-text-secondary">
          Review grower check-in photos and approve quality ·{" "}
          <span
            className={`font-semibold ${
              queue.length > 0 ? "text-amber-600" : "text-sprout-700"
            }`}
          >
            {queue.length} pending
          </span>
        </p>
      </div>

      <QCClient initialQueue={queue} />
    </div>
  );
}
