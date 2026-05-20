import { BatchStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { updateGrowerScores } from "@/lib/business";
import { prisma } from "@/lib/prisma";
import { hubQcSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const input = hubQcSchema.parse(await request.json());
    const batch = await prisma.batch.update({
      where: { id: input.batchId },
      data: { status: input.result === "PASS" ? BatchStatus.HARVESTED : BatchStatus.REJECTED },
      include: { task: true },
    });

    await updateGrowerScores(batch.task.growerId);
    return ok(batch);
  } catch (error) {
    return parseError(error);
  }
}
