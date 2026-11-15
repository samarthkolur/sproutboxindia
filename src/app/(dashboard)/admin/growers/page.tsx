import Link from "next/link";
import { Users } from "lucide-react";
import { VerifyFssaiButton } from "@/components/admin/VerifyFssaiButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FilterChips } from "@/components/ui/filter-chips";
import { Meter } from "@/components/ui/meter";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { UrlSearch } from "@/components/ui/url-search";
import { GROWER_FILTERS, fssaiKind, growerMatches, parseGrowerFilter, scorePercent, type GrowerFilter } from "@/lib/admin";
import { getAdminGrowers } from "@/lib/admin-data";

type Row = Awaited<ReturnType<typeof getAdminGrowers>>[number];

const LABEL: Record<GrowerFilter, string> = { all: "All", verified: "FSSAI verified", pending: "FSSAI pending", missing: "No FSSAI", inactive: "Inactive" };
const FSSAI_STATUS = { verified: "FSSAI_VERIFIED", pending: "FSSAI_PENDING", missing: "FSSAI_MISSING" } as const;

const COLUMNS: Column<Row>[] = [
  {
    key: "grower",
    header: "Grower",
    mobile: "title",
    cell: (g) => (
      <>
        {g.name}
        <span className="block text-micro font-normal text-ink-muted" data-i18n-ignore>{g.email}</span>
      </>
    ),
  },
  { key: "city", header: "City", cell: (g) => <span data-i18n-ignore>{g.city}</span> },
  { key: "kit", header: "Kit", cell: (g) => <span className="whitespace-nowrap">{`${g.activeTrays} of ${g.kitSize} trays`}</span> },
  {
    key: "score",
    header: "Score",
    cell: (g) => {
      const percent = scorePercent(g.compositeScore, g.scoredTrays);
      return percent === null ? (
        <span className="text-ink-muted">No scores yet</span>
      ) : (
        <span className="flex items-center gap-2">
          <Meter value={percent} label={`${g.name} score`} className="w-16" />
          <span className="tabular-nums">{`${percent}%`}</span>
        </span>
      );
    },
  },
  { key: "fssai", header: "FSSAI", cell: (g) => <StatusChip status={FSSAI_STATUS[fssaiKind(g)]} /> },
  { key: "status", header: "Status", cell: (g) => <StatusChip status={g.isActive ? "ACTIVE" : "INACTIVE"} /> },
  {
    key: "actions",
    header: "Actions",
    align: "right",
    cell: (g) =>
      // Above the row's stretched link: a pending number can be verified without opening the grower.
      g.fssaiRegNumber && !g.fssaiVerifiedAt ? (
        <span className="relative z-10 inline-flex">
          <VerifyFssaiButton growerId={g.id} growerName={g.name} fssaiRegNumber={g.fssaiRegNumber} size="sm" />
        </span>
      ) : null,
  },
];

export default async function AdminGrowersPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const all = await getAdminGrowers();
  const status = parseGrowerFilter(searchParams.status);
  const query = (searchParams.q ?? "").slice(0, 80).trim().toLowerCase();

  const searched = query ? all.filter((g) => g.name.toLowerCase().includes(query) || g.email.toLowerCase().includes(query) || g.city.toLowerCase().includes(query)) : all;
  const shown = searched.filter((g) => growerMatches(g, status));
  const pending = all.filter((g) => growerMatches(g, "pending")).length;

  const href = (value: string) => {
    const next = new URLSearchParams();
    if (value !== "all") next.set("status", value);
    if (query) next.set("q", query);
    const qs = next.toString();
    return qs ? `/admin/growers?${qs}` : "/admin/growers";
  };

  return (
    <>
      <PageHeader
        title="Growers"
        subtitle={pending > 0 ? (pending === 1 ? "1 FSSAI number is waiting to be verified." : `${pending} FSSAI numbers are waiting to be verified.`) : "Everyone who grows for SproutBox."}
      />
      {all.length === 0 ? (
        <EmptyState icon={Users} title="No growers yet" description="Grower profiles appear here after they join." />
      ) : (
        <>
          <FilterChips
            ariaLabel="Filter growers"
            value={status}
            hrefFor={href}
            chips={GROWER_FILTERS.map((value) => ({ value, label: LABEL[value], count: searched.filter((g) => growerMatches(g, value)).length }))}
            className="mb-4"
          />
          <UrlSearch query={query} placeholder="Search by name, email or city" ariaLabel="Search growers" className="mb-5 max-w-sm" />
          <DataTable
            caption="Growers"
            columns={COLUMNS}
            rows={shown}
            rowKey={(g) => g.id}
            rowHref={(g) => `/admin/growers/${g.id}`}
            rowLabel={(g) => g.name}
            empty={
              <EmptyState
                icon={Users}
                title="No growers match"
                description="Try another filter or a different search."
                action={
                  <Link href="/admin/growers" className="rounded-full border border-hairline bg-panel/60 px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink">
                    Clear filters
                  </Link>
                }
              />
            }
          />
        </>
      )}
    </>
  );
}
