"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

const UPI_PATTERN = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

/** Lets a grower add or change their payout UPI ID after sign-up. */
export async function updateGrowerUpi(upiId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "GROWER") {
    return { error: "Unauthorized" };
  }

  const value = upiId.trim();
  if (!UPI_PATTERN.test(value)) {
    return { error: "Enter a valid UPI ID, e.g. name@okbank" };
  }

  await prisma.grower.update({
    where: { userId: session.user.id },
    data: { upiId: value },
  });
  revalidatePath("/grower/profile");

  return { success: true };
}
