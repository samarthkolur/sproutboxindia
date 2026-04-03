"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/lib/types"

/* ── Sign Up ───────────────────────────────────── */
export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const role = (formData.get("role") as UserRole) || "grower"

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Insert profile row (the trigger may also handle this, belt & suspenders)
  if (data.user) {
    console.log("signUp: attempting to upsert profile for user", data.user.id);
    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
    })
    if (upsertError) {
      console.error("signUp: profile upsert failed!", upsertError.message, upsertError.details);
    } else {
      console.log("signUp: profile upsert successful!");
    }
  }

  redirect(`/${role}`)
}

/* ── Sign In ───────────────────────────────────── */
export async function signIn(formData: FormData) {
  console.log("signIn: starting for email", formData.get("email"));
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error("signIn: Supabase auth error", error.message);
    return { error: error.message }
  }

  // Fetch role for redirect
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("signIn: auth successful, user ID:", user?.id);

  if (!user) {
    console.log("signIn: no user returned, redirecting to /login");
    redirect("/login")
  }

  // Get the role — do NOT wrap redirect() in try/catch!
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  console.log("signIn: fetched profile role:", profile?.role);

  const redirectPath = `/${profile?.role || "grower"}`;
  console.log("signIn: triggering redirect to", redirectPath);
  
  // Redirect to role-specific dashboard
  redirect(redirectPath)
}

/* ── Sign Out ──────────────────────────────────── */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

/* ── Get Current Profile ───────────────────────── */
export async function getCurrentProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return profile
}
