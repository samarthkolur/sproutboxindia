import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — IMPORTANT: do not remove this
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes — redirect to login if unauthenticated
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup")
  const isDashboardPage = request.nextUrl.pathname.startsWith("/grower") ||
    request.nextUrl.pathname.startsWith("/restaurant") ||
    request.nextUrl.pathname.startsWith("/admin")

  if (!user && isDashboardPage) {
    console.log("middleware: no user, redirecting dashboard access to /login");
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // If logged in and on auth page, redirect to dashboard based on role
  if (user && isAuthPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    console.log("middleware: logged in user accessing auth page. Fetched role:", profile?.role);

    if (profile?.role) {
      const url = request.nextUrl.clone()
      url.pathname = `/${profile.role}`
      console.log("middleware: redirecting from auth page to", url.pathname);
      return NextResponse.redirect(url)
    }
    // No profile yet — let them stay on auth page
    console.log("middleware: user has no profile role, allowing load of auth page");
  }

  return supabaseResponse
}
