import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const roleRoutes: Record<string, string> = {
  GROWER: "/grower/dashboard",
  RESTAURANT: "/restaurant/dashboard",
  ADMIN: "/admin/dashboard",
};

const protectedPrefixes = ["/grower", "/restaurant", "/admin"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (req.auth?.user as any)?.role;

  const isProtected = protectedPrefixes.some((prefix) =>
    nextUrl.pathname.startsWith(prefix)
  );

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  // Redirect logged-in users away from auth pages to their dashboard
  if (isAuthPage && isLoggedIn && userRole) {
    return NextResponse.redirect(
      new URL(roleRoutes[userRole] || "/", nextUrl)
    );
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
      return NextResponse.next();
    }

    // Check if user is accessing their allowed section
    if (!nextUrl.pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(
        new URL(roleRoutes[userRole] || "/", nextUrl)
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/grower/:path*",
    "/restaurant/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
