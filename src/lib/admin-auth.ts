import { auth } from "@/lib/auth";

/**
 * The signed-in admin, or null. Server actions are public endpoints (anyone who can send a
 * request can call one), so every admin action checks this itself instead of relying on the
 * page it is used from being behind the admin middleware.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session.user;
}

export const NOT_ADMIN = { error: "Unauthorized" } as const;
