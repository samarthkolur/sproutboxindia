"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Loader2, MapPin, Truck } from "lucide-react";
import { toast } from "sonner";
import { markGrowerSuppliesDelivered, markSeedsDelivered, undoSuppliesDelivered } from "@/actions/dispatch.actions";
import { EmptyState } from "@/components/shared/EmptyState";
import { Panel } from "@/components/ui/panel";
import { StatusChip } from "@/components/ui/status-chip";
import { cropName, waitingFor } from "@/lib/admin";

export interface DispatchTask {
  id: string;
  cropType: string;
  trayCount: number;
  allocatedAt: Date;
  restaurant: string;
}

export interface DispatchGroup {
  growerId: string;
  name: string;
  city: string;
  tasks: DispatchTask[];
}

// Tasks grouped by grower. "Mark all delivered" settles everything a grower is owed in one
// click and, like a single task, can be undone from the toast while nobody has started growing.
export function DispatchClient({ groups: initial }: { groups: DispatchGroup[] }) {
  const router = useRouter();
  const [groups, setGroups] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  function remove(taskIds: string[]) {
    setGroups((current) => current.map((g) => ({ ...g, tasks: g.tasks.filter((t) => !taskIds.includes(t.id)) })).filter((g) => g.tasks.length > 0));
  }

  async function deliver(group: DispatchGroup, tasks: DispatchTask[]) {
    const ids = tasks.map((t) => t.id);
    setBusy(ids.join());
    try {
      if (tasks.length === group.tasks.length) await markGrowerSuppliesDelivered(group.growerId);
      else for (const task of tasks) await markSeedsDelivered(task.id);
      remove(ids);
      router.refresh();
      toast.success(tasks.length === 1 ? "Supplies marked delivered" : `${tasks.length} tasks marked delivered`, {
        description: `${group.name} has been told.`,
        duration: 8000,
        action: {
          label: "Undo",
          onClick: async () => {
            const result = await undoSuppliesDelivered(ids);
            if (result.count > 0) {
              setGroups((current) => {
                const restored = current.find((g) => g.growerId === group.growerId);
                if (restored) return current.map((g) => (g.growerId === group.growerId ? { ...g, tasks: [...g.tasks, ...tasks] } : g));
                return [...current, { ...group, tasks }];
              });
              router.refresh();
            } else {
              toast.error("This can no longer be undone", { description: "The grower has already started." });
            }
          },
        },
      });
    } catch (error) {
      toast.error("Could not mark delivered", { description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setBusy(null);
    }
  }

  if (groups.length === 0) {
    return <EmptyState icon={Truck} title="No supplies waiting" description="Every allocated task has had its seeds and trays delivered." />;
  }

  return (
    <ul className="space-y-3">
      {groups.map((group) => {
        const trays = group.tasks.reduce((sum, t) => sum + t.trayCount, 0);
        const oldest = new Date(Math.min(...group.tasks.map((t) => t.allocatedAt.getTime())));
        const working = busy === group.tasks.map((t) => t.id).join();
        return (
          <li key={group.growerId}>
            <Panel padding="none">
              <details className="group" open={groups.length <= 3}>
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 rounded-panel p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 sm:p-5 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">
                    <span className="block text-base font-medium text-ink">{group.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-micro text-ink-muted">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        {group.city}
                      </span>
                      <span>{`${group.tasks.length} ${group.tasks.length === 1 ? "task" : "tasks"} · ${trays} trays`}</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <StatusChip tone="watch" label={`Allocated ${waitingFor(oldest)}`} />
                    <ChevronDown className="h-4 w-4 text-ink-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
                  </span>
                </summary>
                <div className="border-t border-hairline/70 px-4 pb-4 sm:px-5">
                  <ul className="divide-y divide-hairline/70">
                    {group.tasks.map((task) => (
                      <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">{`${cropName(task.cropType)}, ${task.trayCount} trays`}</p>
                          <p className="text-micro text-ink-muted">
                            <span>For </span>
                            <span data-i18n-ignore>{task.restaurant}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{`Allocated ${waitingFor(task.allocatedAt)}`}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          data-no-global-loading
                          disabled={busy !== null}
                          onClick={() => deliver(group, [task])}
                          className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-panel/60 px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Mark seeds delivered
                        </button>
                      </li>
                    ))}
                  </ul>
                  {group.tasks.length > 1 ? (
                    <button
                      type="button"
                      data-no-global-loading
                      disabled={busy !== null}
                      onClick={() => deliver(group, group.tasks)}
                      className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {working ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
                      Mark all delivered
                    </button>
                  ) : null}
                </div>
              </details>
            </Panel>
          </li>
        );
      })}
    </ul>
  );
}
