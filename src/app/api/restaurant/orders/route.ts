import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "RESTAURANT") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: session.user.id },
      include: {
        orders: {
          include: { delivery: { include: { hub: true } }, feedback: true, productionPlan: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return ok(restaurant?.orders || []);
  } catch (error) {
    return parseError(error);
  }
}
