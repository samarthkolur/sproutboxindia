"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
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

export async function verifyGrowerFssai(growerId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const grower = await prisma.grower.findUnique({ where: { id: growerId } });
  if (!grower?.fssaiRegNumber) {
    return { error: "Grower has not submitted an FSSAI registration number yet" };
  }

  await prisma.grower.update({
    where: { id: growerId },
    data: { fssaiVerifiedAt: new Date() },
  });

  return { success: true };
}

/** Pause or resume a grower. An inactive grower is skipped by allocation. */
export async function setGrowerActive(growerId: string, active: boolean) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return { error: "Unauthorized" };

  const grower = await prisma.grower.findUnique({ where: { id: growerId } });
  if (!grower) return { error: "Grower not found" };

  await prisma.grower.update({ where: { id: growerId }, data: { isActive: active } });
  revalidatePath("/admin/growers");
  revalidatePath(`/admin/growers/${growerId}`);
  return { success: true };
}
