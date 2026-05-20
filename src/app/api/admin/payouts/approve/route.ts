import { PayoutStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { payoutApproveSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const input = payoutApproveSchema.parse(await request.json());
    const result = await prisma.payout.updateMany({
      where: { id: { in: input.payoutIds }, status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] } },
      data: { status: PayoutStatus.PAID, paidAt: new Date() },
    });

    return ok(result);
  } catch (error) {
    return parseError(error);
  }
}
