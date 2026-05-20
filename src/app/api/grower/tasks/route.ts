import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "GROWER") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const grower = await prisma.grower.findUnique({
      where: { userId: session.user.id },
      include: {
        tasks: {
          include: { batches: { include: { checkIns: true } } },
          orderBy: { allocatedAt: "desc" },
        },
      },
    });

    return ok(grower?.tasks || []);
  } catch (error) {
    return parseError(error);
  }
}
