import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return fail("Unauthorized", "UNAUTHORIZED", 401);

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return ok(notifications);
  } catch (error) {
    return parseError(error);
  }
}
