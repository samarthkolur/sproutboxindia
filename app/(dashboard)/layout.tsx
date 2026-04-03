import { getCurrentProfile } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import DashboardSidebar from "@/components/layout/DashboardSidebar"
import DashboardTopBar from "@/components/layout/DashboardTopBar"
import type { Role } from "@/components/layout/DashboardSidebar"

export const metadata: Metadata = {
  title: "SproutBox — Dashboard",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect("/login")
  }

  const role: Role = (profile.role as Role) || "grower"

  return (
    <div className="flex min-h-screen bg-black">
      {/* Side Navigation */}
      <DashboardSidebar role={role} />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        
        {/* Top Header Navigation */}
        <DashboardTopBar 
          profile={{
            full_name: profile.full_name,
            email: profile.email,
            role: profile.role
          }}
        />

        <main className="flex-1 p-6 md:p-8 lg:p-12 overflow-y-auto">
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

