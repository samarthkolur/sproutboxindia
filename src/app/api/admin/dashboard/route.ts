import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { getAdminOverview } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }
    return ok(await getAdminOverview(session.user.id));
  } catch (error) {
    return parseError(error);
  }
}
