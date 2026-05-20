import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user) return fail("Unauthorized", "UNAUTHORIZED", 401);

    const result = await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });

    return ok(result);
  } catch (error) {
    return parseError(error);
  }
}
