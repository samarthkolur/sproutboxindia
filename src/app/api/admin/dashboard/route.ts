import { auth } from "@/lib/auth";
import { fail, ok, parseError } from "@/lib/api";
import { getAdminKPIs, getAdminPendingCounts } from "@/actions/dashboard.actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return fail("Unauthorized", "UNAUTHORIZED", 401);
    }

    const [kpis, pending] = await Promise.all([getAdminKPIs(), getAdminPendingCounts()]);
    return ok({ kpis, pending });
  } catch (error) {
    return parseError(error);
  }
}
