import { notFound } from "next/navigation";
import { DayInstructions } from "@/components/grower/DayInstructions";
import { TaskCard } from "@/components/grower/TaskCard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function GrowerTaskDetailPage({ params }: { params: { taskId: string } }) {
  const session = await auth();
  const task = await prisma.task.findFirst({
    where: { id: params.taskId, grower: { userId: session?.user?.id } },
    include: { batches: true },
  });

  if (!task) notFound();
  const currentDay = task.batches.length ? Math.max(...task.batches.map((batch) => batch.currentDay)) : 0;

  return (
    <div className="space-y-6">
      <TaskCard cropType={task.cropType} trayCount={task.trayCount} status={task.status} sowDate={task.sowDate} harvestDate={task.harvestDate} />
      <DayInstructions cropType={task.cropType} currentDay={currentDay} />
    </div>
  );
}
