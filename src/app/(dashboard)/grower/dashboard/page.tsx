import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowRight, BellRing, BookOpen, ClipboardCheck, Sprout, Star, Wallet } from "lucide-react";
import { getGrowerHome } from "@/lib/grower-data";
import { auth } from "@/lib/auth";
import { EarningsChartCard } from "@/components/grower/EarningsChartCard";
import { TaskAction } from "@/components/grower/TaskAction";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Ring } from "@/components/ui/ring";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusChip } from "@/components/ui/status-chip";
import { earningsSummary, greetingFor, qcTile, rupees, sentenceForCheckins, weeklyEarnings } from "@/lib/grower";
import { cropName, getTaskState } from "@/lib/tasks";

export default async function GrowerDashboard() {
  const session = await auth();
  const home = await getGrowerHome(session?.user?.id ?? "");
  const now = new Date();

  if (!home) {
    return (
      <>
        <PageHeader title={greetingFor(now)} subtitle="Your grower profile is not set up yet." />
        <EmptyState
          icon={Sprout}
          title="No grower profile found"
          description="Finish joining as a grower and your tasks, earnings and tray checks will appear here."
          action={
            <Link href="/join/grower" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-ink">
              Join as a grower
            </Link>
          }
        />
      </>
    );
  }

  const { grower, payouts, scoredTrays, notifications } = home;
  const states = grower.tasks.map((task) => ({ task, state: getTaskState(task, now) }));
  const actionable = states.filter(({ task, state }) => state.canCheckIn || state.canRequestPickup || task.status === "HARVEST_READY");
  const due = states.filter(({ state }) => state.canCheckIn).length;
  const activeTrays = grower.tasks.reduce((sum, task) => sum + task.trayCount, 0);
  const { paid, pending } = earningsSummary(payouts);
  const qc = qcTile(grower.qualityScore, scoredTrays);

  // The grow-cycle ring follows the task furthest along that is still growing.
  const growing = states
    .filter(({ task }) => task.status === "IN_PROGRESS" || task.status === "ASSIGNED")
    .sort((a, b) => b.state.progress - a.state.progress)[0];

  return (
    <>
      <PageHeader
        eyebrow={format(now, "EEEE, d MMMM")}
        title={greetingFor(now)}
        subtitle={sentenceForCheckins(due, activeTrays)}
        actions={
          <Link
            href="/grower/tutorial"
            className="inline-flex items-center gap-2 rounded-full border border-hairline bg-panel/60 px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            How to grow guide
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Active trays"
          icon={<Sprout />}
          value={activeTrays}
          caption={activeTrays > 0 ? `Growing across ${grower.tasks.length} ${grower.tasks.length === 1 ? "task" : "tasks"}` : "Ready for your next task"}
          href="/grower/tasks"
        />
        <StatTile
          label="Check-ins due"
          icon={<ClipboardCheck />}
          value={due}
          tone={due > 0 ? "watch" : "good"}
          caption={due > 0 ? "Photos for today are waiting" : "All caught up for today"}
          href="/grower/tasks"
        />
        <StatTile
          label="Earned"
          icon={<Wallet />}
          value={rupees(paid)}
          caption={pending > 0 ? `${rupees(pending)} still pending` : "Paid out to you so far"}
          href="/grower/earnings"
        />
        <StatTile label="QC score" icon={<Star />} value={qc.value} tone={qc.tone} caption={qc.caption} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-5">
        <div className="min-w-0 space-y-4">
          {/* G: the one dark card on the page, with the action inline. */}
          <section aria-labelledby="today-heading" className="rounded-panel bg-brand p-5 text-brand-ink shadow-pop sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="today-heading" className="text-lg font-medium">
                Today&apos;s tasks
              </h2>
              <Link href="/grower/tasks" className="inline-flex items-center gap-1 text-sm text-brand-ink/80 hover:text-brand-ink">
                View all tasks
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {actionable.length > 0 ? (
              <ul className="mt-4 divide-y divide-brand-ink/15">
                {actionable.map(({ task, state }) => (
                  <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link href={`/grower/tasks/${task.id}`} className="text-base font-medium hover:underline">
                        {cropName(task.cropType)}
                      </Link>
                      <p className="mt-0.5 text-sm text-brand-ink/75">{`${task.trayCount} trays · Day ${state.currentDay} of ${state.totalDays}`}</p>
                      {state.canCheckIn && state.todayInstruction ? (
                        <p className="mt-1 max-w-md text-sm text-brand-ink/90">{state.todayInstruction}</p>
                      ) : null}
                    </div>
                    <TaskAction task={task} tone="onDark" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-brand-ink/80">
                {grower.tasks.length > 0 ? "Nothing needs you right now. Your trays are growing." : "New tasks will show up here as soon as they are assigned to you."}
              </p>
            )}
          </section>

          <EarningsChartCard buckets={weeklyEarnings(payouts, now, 12)} />
        </div>

        <div className="min-w-0 space-y-4">
          <Panel>
            <PanelHeader title="Grow cycle" subtitle={growing ? cropName(growing.task.cropType) : undefined} />
            {growing ? (
              <Link href={`/grower/tasks/${growing.task.id}`} className="flex items-center gap-5 rounded-tile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
                <Ring percent={growing.state.progress} size={104} label={`${growing.state.progress}% of the grow cycle`}>
                  <span className="text-2xl font-light tabular-nums text-ink">{growing.state.currentDay}</span>
                  <span className="text-micro text-ink-muted">{`of ${growing.state.totalDays} days`}</span>
                </Ring>
                <div className="min-w-0">
                  <p className="text-sm text-ink-soft">{`Day ${growing.state.currentDay} of ${growing.state.totalDays}`}</p>
                  <p className="mt-1 text-micro text-ink-muted">{`${growing.task.trayCount} trays, harvest on ${format(growing.task.harvestDate, "d MMM")}`}</p>
                  <div className="mt-2">
                    <StatusChip status={growing.task.status} />
                  </div>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-ink-muted">No tray is growing right now.</p>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Recent activity" subtitle="Updates from the team" />
            {notifications.length > 0 ? (
              <ul className="space-y-4">
                {notifications.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <span aria-hidden="true" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leaf-soft text-ink-soft">
                      <BellRing className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{item.title}</p>
                      <p className="text-sm text-ink-soft">{item.message}</p>
                      <time data-i18n-ignore dateTime={item.createdAt.toISOString()} className="text-micro text-ink-muted">
                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">Nothing new yet. Updates about your trays and payouts will appear here.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
