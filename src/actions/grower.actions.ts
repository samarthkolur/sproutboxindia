"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentGrowerTasks() {
  const session = await auth();
  if (!session?.user) return [];
  const grower = await prisma.grower.findUnique({
    where: { userId: session.user.id },
    include: { tasks: { include: { batches: true }, orderBy: { allocatedAt: "desc" } } },
  });
  return grower?.tasks || [];
}
