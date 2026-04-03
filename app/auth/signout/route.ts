import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Clear the session from Supabase
  await supabase.auth.signOut()
  
  // Get the base URL from the incoming request (e.g. http://localhost:3000)
  const url = new URL("/login", request.url)
  
  // Make sure we purge whatever local tracking/cookies the browser has related to next execution
  return NextResponse.redirect(url, { status: 303 }) // Use 303 See Other for POST-to-GET redirect
}
