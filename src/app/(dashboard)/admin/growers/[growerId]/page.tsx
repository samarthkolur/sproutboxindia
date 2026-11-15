import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ChevronRight, ShieldAlert, ShieldCheck } from "lucide-react";
import { GrowerStatusToggle } from "@/components/admin/GrowerStatusToggle";
import { VerifyFssaiButton } from "@/components/admin/VerifyFssaiButton";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusChip } from "@/components/ui/status-chip";
import { Tabs } from "@/components/ui/tabs";
import { cropName, fssaiKind, rupees, scorePercent } from "@/lib/admin";
import { getAdminGrower } from "@/lib/admin-data";
import { earningsSummary } from "@/lib/grower";

type Data = NonNullable<Awaited<ReturnType<typeof getAdminGrower>>>;
type TaskRow = Data["grower"]["tasks"][number];
type PayoutRow = Data["grower"]["payouts"][number];

const TABS = [
  { value: "tasks", label: "Tasks" },
  { value: "payouts", label: "Payouts" },
  { value: "compliance", label: "Compliance" },
];

const TASK_COLUMNS: Column<TaskRow>[] = [
  { key: "crop", header: "Crop", mobile: "title", cell: (t) => cropName(t.cropType) },
  { key: "trays", header: "Trays", cell: (t) => `${t.trayCount} trays` },
  { key: "for", header: "For", cell: (t) => <span data-i18n-ignore>{t.plan.order.restaurant.businessName}</span> },
  { key: "dates", header: "Sown", cell: (t) => <time dateTime={t.sowDate.toISOString()}>{format(t.sowDate, "d MMM yyyy")}</time> },
  { key: "status", header: "Status", cell: (t) => <StatusChip status={t.status} /> },
];

const PAYOUT_COLUMNS: Column<PayoutRow>[] = [
  {
    key: "tray",
    header: "Tray",
    mobile: "title",
    cell: (p) => (
      <>
        {cropName(p.batch.task.cropType)}
        <span className="block text-micro font-normal text-ink-muted">{`Tray ${p.batch.trayNumber}`}</span>
      </>
    ),
  },
  { key: "date", header: "Date", cell: (p) => <time dateTime={(p.paidAt ?? p.createdAt).toISOString()}>{format(p.paidAt ?? p.createdAt, "d MMM yyyy")}</time> },
  { key: "status", header: "Status", cell: (p) => <StatusChip status={p.status} /> },
  { key: "amount", header: "Amount", align: "right", cell: (p) => <span className="font-medium text-ink">{rupees(p.amount)}</span> },
];

const FSSAI_STATUS = { verified: "FSSAI_VERIFIED", pending: "FSSAI_PENDING", missing: "FSSAI_MISSING" } as const;

export default async function AdminGrowerDetailPage({ params, searchParams }: { params: { growerId: string }; searchParams: { tab?: string } }) {
  const data = await getAdminGrower(params.growerId);
  if (!data) notFound();
  const { grower, scoredTrays } = data;
  const tab = TABS.some((t) => t.value === searchParams.tab) ? searchParams.tab! : "tasks";
  const name = grower.user.name ?? grower.user.email;
  const { paid, pending } = earningsSummary(grower.payouts);
  const kind = fssaiKind(grower);
  const score = (value: number) => scorePercent(value, scoredTrays);
  const pct = (value: number) => (score(value) === null ? "—" : `${score(value)}%`);

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-ink-muted">
        <Link href="/admin/growers" className="rounded hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
          Growers
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span aria-current="page" className="font-medium text-ink" data-i18n-ignore>{name}</span>
      </nav>

      <PageHeader
        title={<span data-i18n-ignore>{name}</span>}
        subtitle={<span data-i18n-ignore>{`${grower.city}${grower.cluster ? ` · ${grower.cluster.name}` : ""}`}</span>}
        actions={<StatusChip status={grower.isActive ? "ACTIVE" : "INACTIVE"} />}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Overall" value={pct(grower.compositeScore)} caption={scoredTrays > 0 ? "Yield, quality and timing combined" : "No scores yet. They appear after the first finished tray."} tone={scoredTrays > 0 && grower.compositeScore >= 0.9 ? "good" : "neutral"} />
        <StatTile label="Yield" value={pct(grower.yieldScore)} caption="Harvest weight vs expected" />
        <StatTile label="Quality" value={pct(grower.qualityScore)} caption="Finished trays that passed" />
        <StatTile label="Timing" value={pct(grower.timelinessScore)} caption="Trays harvested by their due date" />
        <StatTile label="Earned" value={rupees(paid)} caption={pending > 0 ? `${rupees(pending)} still pending` : "Paid out so far"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-5">
        <div className="min-w-0">
          <Tabs ariaLabel="Grower sections" items={TABS} value={tab} hrefFor={(value) => `/admin/growers/${grower.id}?tab=${value}`} className="mb-4" />

          {tab === "tasks" ? (
            <DataTable
              caption="Tasks"
              columns={TASK_COLUMNS}
              rows={grower.tasks}
              rowKey={(t) => t.id}
              empty={<Panel><p className="text-sm text-ink-muted">No tasks have been given to this grower yet.</p></Panel>}
            />
          ) : null}

          {tab === "payouts" ? (
            <DataTable
              caption="Payouts"
              columns={PAYOUT_COLUMNS}
              rows={grower.payouts}
              rowKey={(p) => p.id}
              rowHref={(p) => `/grower/tasks/${p.batch.task.id}`}
              rowLabel={(p) => `${cropName(p.batch.task.cropType)}, tray ${p.batch.trayNumber}, ${rupees(p.amount)}`}
              empty={<Panel><p className="text-sm text-ink-muted">No payouts yet.</p></Panel>}
            />
          ) : null}

          {tab === "compliance" ? (
            <Panel>
              <PanelHeader title="FSSAI registration" subtitle="Food safety law requires it before a grower supplies restaurants" />
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {kind === "verified" ? <ShieldCheck className="mt-0.5 h-5 w-5 text-good" aria-hidden="true" /> : <ShieldAlert className="mt-0.5 h-5 w-5 text-watch" aria-hidden="true" />}
                  <div className="min-w-0">
                    <StatusChip status={FSSAI_STATUS[kind]} />
                    <p className="mt-2 text-sm text-ink-soft" data-i18n-ignore>{grower.fssaiRegNumber ?? ""}</p>
                    {!grower.fssaiRegNumber ? <p className="mt-2 text-sm text-ink-soft">No registration number has been submitted.</p> : null}
                    {grower.fssaiVerifiedAt ? (
                      <p className="mt-1 text-micro text-ink-muted">
                        <span>Verified </span>
                        <time dateTime={grower.fssaiVerifiedAt.toISOString()}>{format(grower.fssaiVerifiedAt, "d MMM yyyy")}</time>
                      </p>
                    ) : null}
                  </div>
                </div>
                {grower.fssaiRegNumber && !grower.fssaiVerifiedAt ? (
                  <VerifyFssaiButton growerId={grower.id} growerName={name} fssaiRegNumber={grower.fssaiRegNumber} />
                ) : null}
              </div>
              <div className="mt-4 border-t border-hairline/70 pt-2">
                <GrowerStatusToggle growerId={grower.id} active={grower.isActive} />
              </div>
            </Panel>
          ) : null}
        </div>

        <Panel className="self-start">
          <PanelHeader title="Contact" />
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-micro text-ink-muted">Email</dt>
              <dd className="break-words font-medium text-ink" data-i18n-ignore>{grower.user.email}</dd>
            </div>
            <div>
              <dt className="text-micro text-ink-muted">Phone</dt>
              <dd className="font-medium text-ink" data-i18n-ignore>{grower.phone}</dd>
            </div>
            <div>
              <dt className="text-micro text-ink-muted">Address</dt>
              <dd className="font-medium text-ink" data-i18n-ignore>{`${grower.address}, ${grower.city} ${grower.pincode}`}</dd>
            </div>
            <div>
              <dt className="text-micro text-ink-muted">Kit</dt>
              <dd className="font-medium text-ink">{`${grower.kitSize} trays`}</dd>
            </div>
            <div>
              <dt className="text-micro text-ink-muted">Joined</dt>
              <dd className="font-medium text-ink">
                <time dateTime={grower.joinedAt.toISOString()}>{format(grower.joinedAt, "d MMM yyyy")}</time>
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
    </>
  );
}
