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

    // A verification belongs to one number. Changing the number puts the grower back in the
    // admin's verification queue instead of leaving a stale "verified" on a number nobody checked.
    let reverify = {};
    if (input.fssaiRegNumber !== undefined) {
      const current = await prisma.grower.findUnique({
        where: { userId: session.user.id },
        select: { fssaiRegNumber: true },
      });
      if (current && current.fssaiRegNumber !== input.fssaiRegNumber) reverify = { fssaiVerifiedAt: null };
    }

    const grower = await prisma.grower.update({
      where: { userId: session.user.id },
      data: { ...input, ...reverify },
    });

    return ok(grower);
  } catch (error) {
    return parseError(error);
  }
}
