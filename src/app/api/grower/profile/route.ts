import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { growerProfileSchema } from "@/lib/schemas";

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "GROWER") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const input = growerProfileSchema.parse(await request.json());
    const grower = await prisma.grower.update({
      where: { userId: session.user.id },
      data: input,
    });

    return ok(grower);
  } catch (error) {
    return parseError(error);
  }
}
