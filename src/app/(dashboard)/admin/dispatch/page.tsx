import { PageHeader } from "@/components/ui/page-header";
import { getPendingDispatches } from "@/actions/dispatch.actions";
import { DispatchClient, type DispatchGroup } from "./DispatchClient";

export default async function DispatchPage() {
  const tasks = await getPendingDispatches();

  // One group per grower, the longest-waiting first, so one trip covers everything they are owed.
  const byGrower = new Map<string, DispatchGroup>();
  for (const task of tasks) {
    const group = byGrower.get(task.growerId) ?? {
      growerId: task.growerId,
      name: task.grower.user.name ?? "Grower",
      city: task.grower.city,
      tasks: [],
    };
    group.tasks.push({
      id: task.id,
      cropType: task.cropType,
      trayCount: task.trayCount,
      allocatedAt: task.allocatedAt,
      restaurant: task.plan.order.restaurant.businessName,
    });
    byGrower.set(task.growerId, group);
  }
  const groups = Array.from(byGrower.values()).sort((a, b) => a.tasks[0].allocatedAt.getTime() - b.tasks[0].allocatedAt.getTime());

  return (
    <>
      <PageHeader title="Dispatch supplies" subtitle="Seeds and trays owed to growers. Mark them delivered once they have them." />
      <DispatchClient groups={groups} />
    </>
  );
}
