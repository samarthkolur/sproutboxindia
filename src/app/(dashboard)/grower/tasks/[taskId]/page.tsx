import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { CheckInHistory, type CheckInEntry } from "@/components/grower/CheckInHistory";
import { TaskAction } from "@/components/grower/TaskAction";
import { InvoiceLink, invoiceHref } from "@/components/shared/InvoiceLink";
import { DetailLayout } from "@/components/ui/detail-layout";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Ring } from "@/components/ui/ring";
import { StatusChip } from "@/components/ui/status-chip";
import { Timeline } from "@/components/ui/timeline";
import { CROP_IMAGES, type CropType } from "@/lib/constants";
import { dayPlan, rupees } from "@/lib/grower";
import { getGrowerTask } from "@/lib/grower-data";
import { cropName, getTaskState } from "@/lib/tasks";

export default async function GrowerTaskDetailPage({ params }: { params: { taskId: string } }) {
  const session = await auth();
  const task = await getGrowerTask(session?.user?.id ?? "", params.taskId);
  if (!task) notFound();

  const state = getTaskState(task);
  const open = task.status === "ASSIGNED" || task.status === "IN_PROGRESS";
  const image = CROP_IMAGES[task.cropType as CropType];
  const name = cropName(task.cropType);

  const history: CheckInEntry[] = task.batches
    .flatMap((b) => b.checkIns.map((c) => ({ c, trayNumber: b.trayNumber })))
    .sort((a, b) => b.c.createdAt.getTime() - a.c.createdAt.getTime())
    .map(({ c, trayNumber }) => ({
      id: c.id,
      day: c.day,
      trayNumber,
      createdAt: c.createdAt.toISOString(),
      imageTopUrl: c.imageTopUrl,
      imageSideUrl: c.imageSideUrl,
      notes: c.notes,
      qcResult: c.qcResult,
      qcNotes: c.qcNotes,
    }));

  // A failed or rejected tray: say why, in the reviewer's words, not just that it failed.
  const problems = task.batches
    .filter((b) => b.status === "QC_FAILED" || b.status === "REJECTED")
    .map((b) => ({
      batch: b,
      reason: b.checkIns.find((c) => c.qcNotes && (c.qcResult === "REJECT" || c.qcResult === "RISK"))?.qcNotes ?? null,
    }));

  const plan = dayPlan(task.cropType, state.currentDay, open);

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-ink-muted">
        <Link href="/grower/tasks" className="rounded hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
          My tasks
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span aria-current="page" className="font-medium text-ink">
          {name}
        </span>
      </nav>

      <DetailLayout
        aside={
          <Panel>
            <PanelHeader title="Day by day" subtitle={`Day ${state.currentDay} of ${state.totalDays}`} />
            <Timeline
              items={plan.map((step) => ({
                key: String(step.day),
                title: `Day ${step.day}`,
                description: step.instruction,
                state: step.state,
                meta: step.state === "current" ? "Today" : step.state === "done" ? "Done" : undefined,
              }))}
            />
          </Panel>
        }
      >
        <Panel padding="none" className="overflow-hidden">
          {image ? (
            <div className="relative h-44 bg-inset sm:h-56">
              <Image src={image} alt={name} fill priority sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-5 p-5 sm:p-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-light tracking-tight text-ink sm:text-3xl">{name}</h1>
                <StatusChip status={task.status} />
              </div>
              <p className="mt-1.5 text-sm text-ink-soft">{`${task.trayCount} trays · Day ${state.currentDay} of ${state.totalDays}`}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-micro text-ink-muted">
                <span>Sown</span>
                <time dateTime={task.sowDate.toISOString()}>{format(task.sowDate, "d MMM")}</time>
                <span aria-hidden="true">→</span>
                <span>Harvest</span>
                <time dateTime={task.harvestDate.toISOString()}>{format(task.harvestDate, "d MMM")}</time>
              </p>
              <div className="mt-4 min-h-[2.25rem]">
                <TaskAction task={task} />
              </div>
            </div>
            <Ring percent={state.progress} size={96} label={`${state.progress}% grown`}>
              <span className="text-2xl font-light tabular-nums text-ink">{`${state.progress}%`}</span>
              <span className="text-micro text-ink-muted">grown</span>
            </Ring>
          </div>
        </Panel>

        {problems.map(({ batch, reason }) => (
          <div key={batch.id} role="alert" className="flex gap-3 rounded-panel bg-risk-soft p-4 text-risk">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{`Tray ${batch.trayNumber} did not pass quality control`}</p>
              <p className="mt-0.5 text-sm">{reason ?? "No reason was recorded. Ask the team for details."}</p>
            </div>
          </div>
        ))}

        <Panel>
          <PanelHeader
            title="Trays"
            subtitle="Each tray is checked and paid on its own"
            actions={
              task.batches.some((b) => b.payout) ? (
                <InvoiceLink href={invoiceHref.grower(task.id)} label="Payout statement" size="sm" />
              ) : undefined
            }
          />
          <ul className="divide-y divide-hairline/70">
            {task.batches.map((batch) => (
              <li key={batch.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{`Tray ${batch.trayNumber}`}</p>
                  <p className="text-micro text-ink-muted">{`Day ${batch.currentDay}`}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {batch.payout ? (
                    <span className="text-sm tabular-nums text-ink-soft">
                      {rupees(batch.payout.amount)}
                    </span>
                  ) : null}
                  {batch.payout ? <StatusChip status={batch.payout.status} /> : null}
                  <StatusChip status={batch.status} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader title="Check-in photos" subtitle="Newest first, with the quality review beside each one" />
          <CheckInHistory entries={history} />
        </Panel>
      </DetailLayout>
    </>
  );
}
