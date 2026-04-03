import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function POST() {
  const supabase = await createClient()
  
  // Clear the session from Supabase
  await supabase.auth.signOut()
  
  // redirect() from next/navigation handles base URL resolution properly
  redirect("/login")
}
