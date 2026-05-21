"use server";

import { signOut } from "@/lib/auth";

export async function performSignOut() {
  await signOut({ redirectTo: "/login" });
}
