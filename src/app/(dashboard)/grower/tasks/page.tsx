import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { auth } from "@/lib/auth";
import { GrowerTaskCard } from "@/components/grower/GrowerTaskCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { FilterChips } from "@/components/ui/filter-chips";
import { PageHeader } from "@/components/ui/page-header";
import { getGrowerTasks } from "@/lib/grower-data";
import { taskFilterOf, type TaskFilter } from "@/lib/grower";
import { getTaskState } from "@/lib/tasks";

const EMPTY: Record<TaskFilter, { title: string; description: string }> = {
  active: { title: "No active tasks", description: "New growing tasks appear here when the team assigns them to you." },
  pickup: { title: "Nothing waiting for pickup", description: "When a tray is ready, request a pickup and it will be listed here." },
  completed: { title: "No completed tasks yet", description: "Harvested and cancelled tasks are kept here." },
};

function parseFilter(value: string | undefined): TaskFilter {
  return value === "pickup" || value === "completed" ? value : "active";
}

export default async function GrowerTasksPage({ searchParams }: { searchParams: { filter?: string } }) {
  const session = await auth();
  const tasks = await getGrowerTasks(session?.user?.id ?? "");
  const filter = parseFilter(searchParams.filter);

  if (!tasks || tasks.length === 0) {
    return (
      <>
        <PageHeader title="My tasks" subtitle="Your growing tasks will be listed here." />
        <EmptyState
          icon={ClipboardList}
          title="No tasks assigned"
          description="New growing tasks will appear here when the team assigns them to you."
        />
      </>
    );
  }

  const count = (value: TaskFilter) => tasks.filter((task) => taskFilterOf(task.status) === value).length;
  const due = tasks.filter((task) => getTaskState(task).canCheckIn).length;
  const shown = tasks.filter((task) => taskFilterOf(task.status) === filter);

  return (
    <>
      <PageHeader
        title="My tasks"
        subtitle={due > 0 ? (due === 1 ? "1 task needs a check-in today." : `${due} tasks need a check-in today.`) : "Every task is up to date."}
      />

      <FilterChips
        ariaLabel="Filter tasks"
        value={filter}
        hrefFor={(value) => (value === "active" ? "/grower/tasks" : `/grower/tasks?filter=${value}`)}
        chips={[
          { value: "active", label: "Active", count: count("active") },
          { value: "pickup", label: "Ready for pickup", count: count("pickup") },
          { value: "completed", label: "Completed", count: count("completed") },
        ]}
        className="mb-5"
      />

      {shown.length > 0 ? (
        <ul className="grid gap-4 xl:grid-cols-2">
          {shown.map((task) => (
            <li key={task.id}>
              <GrowerTaskCard task={task} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={EMPTY[filter].title}
          description={EMPTY[filter].description}
          action={
            filter !== "active" ? (
              <Link href="/grower/tasks" className="rounded-full border border-hairline bg-panel/60 px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink">
                Back to active tasks
              </Link>
            ) : undefined
          }
        />
      )}
    </>
  );
}
