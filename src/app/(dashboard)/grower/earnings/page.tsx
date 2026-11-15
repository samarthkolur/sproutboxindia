import { format } from "date-fns";
import { Wallet } from "lucide-react";
import { auth } from "@/lib/auth";
import { EarningsChartCard } from "@/components/grower/EarningsChartCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusChip } from "@/components/ui/status-chip";
import { earningsSummary, rupees, weeklyEarnings } from "@/lib/grower";
import { getGrowerEarnings } from "@/lib/grower-data";
import { cropName } from "@/lib/tasks";

type PayoutRow = NonNullable<Awaited<ReturnType<typeof getGrowerEarnings>>>[number];

const COLUMNS: Column<PayoutRow>[] = [
  {
    key: "task",
    header: "Task",
    mobile: "title",
    // Which crop and tray the money is for, instead of "Batch Payout" on every row.
    cell: (row) => (
      <>
        {cropName(row.batch.task.cropType)}
        <span className="block text-micro font-normal text-ink-muted">{`Tray ${row.batch.trayNumber}`}</span>
      </>
    ),
  },
  { key: "date", header: "Date", cell: (row) => <time dateTime={row.createdAt.toISOString()}>{format(row.createdAt, "d MMM yyyy")}</time> },
  { key: "status", header: "Status", cell: (row) => <StatusChip status={row.status} /> },
  { key: "amount", header: "Amount", align: "right", cell: (row) => <span className="font-medium text-ink">{rupees(row.amount)}</span> },
];

export default async function GrowerEarningsPage() {
  const session = await auth();
  const payouts = await getGrowerEarnings(session?.user?.id ?? "");
  const { paid, pending } = earningsSummary(payouts ?? []);

  return (
    <>
      <PageHeader title="Earnings" subtitle="What you have earned, and what is on its way." />

      <Panel padding="lg" className="mb-4">
        <p className="text-sm text-ink-soft">Total earned</p>
        <p className="mt-1 text-5xl font-light leading-none tracking-tight text-ink tabular-nums sm:text-6xl">{rupees(paid)}</p>
        <p className="mt-3 text-sm text-ink-muted">
          {pending > 0 ? `${rupees(pending)} is pending and will be paid after quality control.` : "Nothing is pending right now."}
        </p>
      </Panel>

      <div className="space-y-4">
        <EarningsChartCard buckets={weeklyEarnings(payouts ?? [], new Date(), 12)} />

        <section aria-labelledby="payouts-heading">
          <h2 id="payouts-heading" className="mb-3 text-base font-semibold text-ink">
            Payout history
          </h2>
          <DataTable
            caption="Payout history"
            columns={COLUMNS}
            rows={payouts ?? []}
            rowKey={(row) => row.id}
            rowHref={(row) => `/grower/tasks/${row.batch.task.id}`}
            rowLabel={(row) => `${cropName(row.batch.task.cropType)}, tray ${row.batch.trayNumber}, ${rupees(row.amount)}`}
            empty={
              <EmptyState
                icon={Wallet}
                title="No payouts yet"
                description="Earnings from trays that pass quality control will appear here."
              />
            }
          />
        </section>
      </div>
    </>
  );
}
