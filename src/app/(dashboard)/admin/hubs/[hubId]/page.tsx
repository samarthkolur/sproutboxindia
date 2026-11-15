import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";
import { DetailLayout } from "@/components/ui/detail-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusChip } from "@/components/ui/status-chip";
import { cropName, shortId } from "@/lib/admin";
import { getAdminHub } from "@/lib/admin-data";

type Delivery = NonNullable<Awaited<ReturnType<typeof getAdminHub>>>["deliveries"][number];

const COLUMNS: Column<Delivery>[] = [
  {
    key: "order",
    header: "Order",
    mobile: "title",
    cell: (d) => (
      <>
        <span data-i18n-ignore>{d.order.restaurant.businessName}</span>
        <span className="block text-micro font-normal text-ink-muted">{`${cropName(d.order.cropType)}, ${d.order.quantityKg} kg · ${shortId(d.order.id)}`}</span>
      </>
    ),
  },
  { key: "date", header: "Delivery date", cell: (d) => <time dateTime={d.order.deliveryDate.toISOString()}>{format(d.order.deliveryDate, "d MMM yyyy")}</time> },
  { key: "status", header: "Status", cell: (d) => <StatusChip status={d.status} /> },
];

export default async function AdminHubDetailPage({ params }: { params: { hubId: string } }) {
  const hub = await getAdminHub(params.hubId);
  if (!hub) notFound();

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-ink-muted">
        <Link href="/admin/hubs" className="rounded hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
          Hubs
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span aria-current="page" className="font-medium text-ink" data-i18n-ignore>{hub.name}</span>
      </nav>
      <PageHeader title={<span data-i18n-ignore>{hub.name}</span>} subtitle={<span data-i18n-ignore>{hub.address}</span>} actions={<StatusChip status={hub.isActive ? "ACTIVE" : "INACTIVE"} />} />

      <DetailLayout
        aside={
          <>
            <Panel>
              <PanelHeader title="Details" />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Cluster</dt>
                  <dd className="font-medium text-ink" data-i18n-ignore>{hub.cluster.name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Drop-off window</dt>
                  <dd className="font-medium tabular-nums text-ink">{`${hub.dropoffStart}–${hub.dropoffEnd}`}</dd>
                </div>
              </dl>
            </Panel>
            <Panel>
              <PanelHeader title="Growers" subtitle="In this hub's cluster" />
              {hub.cluster.growers.length > 0 ? (
                <ul className="divide-y divide-hairline/70">
                  {hub.cluster.growers.map((g) => (
                    <li key={g.id} className="py-2.5 first:pt-0 last:pb-0">
                      <Link href={`/admin/growers/${g.id}`} className="text-sm font-medium text-ink hover:underline" data-i18n-ignore>
                        {g.user.name ?? "Grower"}
                      </Link>
                      <p className="text-micro text-ink-muted" data-i18n-ignore>{g.city}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">No growers are assigned to this cluster.</p>
              )}
            </Panel>
          </>
        }
      >
        <section aria-labelledby="hub-deliveries">
          <h2 id="hub-deliveries" className="mb-3 text-base font-semibold text-ink">
            Deliveries
          </h2>
          <DataTable
            caption="Deliveries"
            columns={COLUMNS}
            rows={hub.deliveries}
            rowKey={(d) => d.id}
            empty={<Panel><p className="text-sm text-ink-muted">No deliveries have gone through this hub yet.</p></Panel>}
          />
        </section>
      </DetailLayout>
    </>
  );
}
