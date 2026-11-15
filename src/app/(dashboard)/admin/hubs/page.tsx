import Link from "next/link";
import { Clock, MapPin, Users, Warehouse } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { getAdminHubs } from "@/lib/admin-data";

export default async function AdminHubsPage() {
  const hubs = await getAdminHubs();

  return (
    <>
      <PageHeader title="Hubs" subtitle="Where harvests are checked and packed before they go out." />
      {hubs.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {hubs.map((hub) => (
            <li key={hub.id}>
              <Panel className="relative h-full transition-shadow focus-within:ring-2 focus-within:ring-brand/40 hover:shadow-pop">
                <Link href={`/admin/hubs/${hub.id}`} className="text-lg font-medium text-ink after:absolute after:inset-0 focus-visible:outline-none">
                  <span data-i18n-ignore>{hub.name}</span>
                </Link>
                <p className="mt-0.5 flex items-start gap-1.5 text-sm text-ink-soft">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <span data-i18n-ignore>{hub.address}</span>
                </p>
                <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="flex items-center gap-1 text-micro text-ink-muted">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      Drop-off
                    </dt>
                    <dd className="font-medium tabular-nums text-ink">{`${hub.dropoffStart}–${hub.dropoffEnd}`}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-micro text-ink-muted">
                      <Users className="h-3 w-3" aria-hidden="true" />
                      Growers
                    </dt>
                    <dd className="font-medium tabular-nums text-ink">{hub.growers}</dd>
                  </div>
                  <div>
                    <dt className="text-micro text-ink-muted">Upcoming</dt>
                    <dd className="font-medium tabular-nums text-ink">{hub.upcoming}</dd>
                  </div>
                </dl>
              </Panel>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Warehouse} title="No hubs yet" description="Hubs are set up by the team. Once one exists, its drop-off window and deliveries appear here." />
      )}
    </>
  );
}
