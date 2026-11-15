import Link from "next/link";
import { format } from "date-fns";
import { Store } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FilterChips } from "@/components/ui/filter-chips";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { UrlSearch } from "@/components/ui/url-search";
import { RESTAURANT_FILTERS, parseRestaurantFilter, restaurantActivity, rupees, type RestaurantFilter } from "@/lib/admin";
import { getAdminRestaurants } from "@/lib/admin-data";

type Row = Awaited<ReturnType<typeof getAdminRestaurants>>[number] & { activity: Exclude<RestaurantFilter, "all"> };

const LABEL: Record<RestaurantFilter, string> = { all: "All", active: "Active", dormant: "Dormant", never: "Never ordered" };
const ACTIVITY_CHIP = { active: { status: "ACTIVE" }, dormant: { status: "DORMANT" }, never: { label: "Never ordered", tone: "neutral" as const } };

const COLUMNS: Column<Row>[] = [
  {
    key: "name",
    header: "Restaurant",
    mobile: "title",
    cell: (r) => (
      <>
        <span data-i18n-ignore>{r.name}</span>
        <span className="block text-micro font-normal text-ink-muted" data-i18n-ignore>{r.city}</span>
      </>
    ),
  },
  { key: "orders", header: "Orders", align: "right", cell: (r) => r.orders },
  { key: "revenue", header: "Revenue", align: "right", cell: (r) => rupees(r.revenue) },
  { key: "last", header: "Last order", cell: (r) => (r.lastOrderAt ? <time dateTime={r.lastOrderAt.toISOString()}>{format(r.lastOrderAt, "d MMM yyyy")}</time> : <span className="text-ink-muted">Never</span>) },
  { key: "status", header: "Status", cell: (r) => <StatusChip {...ACTIVITY_CHIP[r.activity]} /> },
  { key: "contact", header: "Contact", cell: (r) => <span data-i18n-ignore>{`${r.contactName}, ${r.phone}`}</span> },
];

export default async function AdminRestaurantsPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const now = new Date();
  const all: Row[] = (await getAdminRestaurants()).map((r) => ({ ...r, activity: restaurantActivity(r.lastOrderAt, now) }));
  const status = parseRestaurantFilter(searchParams.status);
  const query = (searchParams.q ?? "").slice(0, 80).trim().toLowerCase();

  const searched = query ? all.filter((r) => r.name.toLowerCase().includes(query) || r.city.toLowerCase().includes(query) || r.contactName.toLowerCase().includes(query)) : all;
  const shown = status === "all" ? searched : searched.filter((r) => r.activity === status);
  const dormant = all.filter((r) => r.activity === "dormant").length;
  const never = all.filter((r) => r.activity === "never").length;

  const href = (value: string) => {
    const next = new URLSearchParams();
    if (value !== "all") next.set("status", value);
    if (query) next.set("q", query);
    const qs = next.toString();
    return qs ? `/admin/restaurants?${qs}` : "/admin/restaurants";
  };

  return (
    <>
      <PageHeader
        title="Restaurants"
        subtitle={
          dormant + never > 0
            ? `${dormant} dormant and ${never} never ordered. Open one to see its history.`
            : "Every restaurant that orders from SproutBox."
        }
      />
      {all.length === 0 ? (
        <EmptyState icon={Store} title="No restaurants yet" description="Restaurant accounts appear here after they join." />
      ) : (
        <>
          <FilterChips
            ariaLabel="Filter restaurants"
            value={status}
            hrefFor={href}
            chips={RESTAURANT_FILTERS.map((value) => ({ value, label: LABEL[value], count: value === "all" ? searched.length : searched.filter((r) => r.activity === value).length }))}
            className="mb-4"
          />
          <UrlSearch query={query} placeholder="Search by name, city or contact" ariaLabel="Search restaurants" className="mb-5 max-w-sm" />
          <DataTable
            caption="Restaurants"
            columns={COLUMNS}
            rows={shown}
            rowKey={(r) => r.id}
            rowHref={(r) => `/admin/restaurants/${r.id}`}
            rowLabel={(r) => r.name}
            empty={
              <EmptyState
                icon={Store}
                title="No restaurants match"
                description="Try another filter or a different search."
                action={
                  <Link href="/admin/restaurants" className="rounded-full border border-hairline bg-panel/60 px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink">
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
