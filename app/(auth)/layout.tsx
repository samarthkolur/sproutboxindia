import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SproutBox — Sign In",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal Header */}
      <div className="flex-none h-16 flex items-center px-6">
        <span className="text-xl font-bold tracking-tight gradient-text-sprout">SproutBox</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 relative">
        {/* Radial glow */}
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-40">
          <div className="h-[500px] w-[600px] rounded-full bg-sprout-500/[0.04] blur-3xl animate-pulse" />
        </div>
        
        <div className="relative z-10 w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
