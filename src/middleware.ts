import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import {
  BOT_HEADER,
  BOT_UA,
  FORCE_COOKIE,
  FORCE_HEADER,
  VISITOR_COOKIE,
  VISITOR_HEADER,
  forceAllowed,
} from "@/lib/experiments/constants";

const roleRoutes: Record<string, string> = {
  GROWER: "/grower/dashboard",
  RESTAURANT: "/restaurant/dashboard",
  ADMIN: "/admin/dashboard",
};

const protectedPrefixes = ["/grower", "/restaurant", "/admin", "/dashboard"];

const NINETY_DAYS = 60 * 60 * 24 * 90;

/** Returns a redirect when auth / role rules require one, otherwise null. */
function authRedirect(
  nextUrl: NextRequest["nextUrl"],
  isLoggedIn: boolean,
  userRole: string | undefined
): NextResponse | null {
  const isProtected = protectedPrefixes.some((prefix) =>
    nextUrl.pathname.startsWith(prefix)
  );

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  // Redirect logged-in users away from auth pages to their dashboard
  if (isAuthPage && isLoggedIn && userRole) {
    return NextResponse.redirect(new URL(roleRoutes[userRole] || "/", nextUrl));
  }

  // Redirect /dashboard to the specific role dashboard
  if (nextUrl.pathname === "/dashboard" && isLoggedIn && userRole) {
    return NextResponse.redirect(new URL(roleRoutes[userRole] || "/", nextUrl));
  }

  // Redirect unauthenticated users to login
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  if (isProtected && isLoggedIn && userRole) {
    const allowedPrefix = `/${userRole.toLowerCase()}`;

    // Special case: admin has their own prefix
    if (userRole === "ADMIN" && nextUrl.pathname.startsWith("/admin")) {
      return null;
    }

    // Check if user is accessing their allowed section
    if (!nextUrl.pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL(roleRoutes[userRole] || "/", nextUrl));
    }
  }

  return null;
}

/**
 * A/B testing: gives every visitor a first-party random id (sb_vid) that
 * server components use to pick experiment variants, flags bots, and
 * forwards QA overrides (?sb_force=exp:variant, ?sb_force=clear).
 */
function withExperiments(req: NextRequest): NextResponse {
  const existing = req.cookies.get(VISITOR_COOKIE)?.value;
  const vid = existing ?? crypto.randomUUID();

  const forwarded = new Headers(req.headers);
  forwarded.set(VISITOR_HEADER, vid);
  forwarded.delete(BOT_HEADER);
  forwarded.delete(FORCE_HEADER);
  if (BOT_UA.test(req.headers.get("user-agent") ?? "")) forwarded.set(BOT_HEADER, "1");

  const forceParam = forceAllowed() ? req.nextUrl.searchParams.get("sb_force") : null;
  if (forceParam && forceParam !== "clear") forwarded.set(FORCE_HEADER, forceParam);

  const res = NextResponse.next({ request: { headers: forwarded } });

  if (!existing) {
    res.cookies.set(VISITOR_COOKIE, vid, {
      maxAge: NINETY_DAYS,
      sameSite: "lax",
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }

  // Keep a QA override for the rest of the browser session.
  if (forceParam === "clear") res.cookies.delete(FORCE_COOKIE);
  else if (forceParam) res.cookies.set(FORCE_COOKIE, forceParam, { path: "/", sameSite: "lax" });

  return res;
}

export default auth((req) => {
  const redirect = authRedirect(req.nextUrl, !!req.auth, req.auth?.user?.role);
  return redirect ?? withExperiments(req);
});

export const config = {
  matcher: [
    // Marketing pages that run experiments
    "/",
    "/about",
    "/join/:path*",
    // Auth + role-protected areas
    "/grower/:path*",
    "/restaurant/:path*",
    "/admin/:path*",
    "/dashboard",
    "/login",
    "/register",
  ],
};
