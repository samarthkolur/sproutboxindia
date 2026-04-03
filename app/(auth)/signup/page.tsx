"use client"

import { useState } from "react"
import Link from "next/link"
import { signUp } from "@/lib/auth"
import { GlassContainer } from "@/components/ui/GlassContainer"
import { Input } from "@/components/ui/Input"
import { MotionButton } from "@/components/ui/button"
import { motion } from "framer-motion"
import type { UserRole } from "@/lib/types"

const roles: { value: UserRole; label: string; description: string; icon: string }[] = [
  { value: "grower", label: "Grower", description: "Grow microgreens at home", icon: "🌱" },
  { value: "restaurant", label: "Restaurant", description: "Order fresh produce", icon: "🍽️" },
  { value: "admin", label: "Admin", description: "Manage the platform", icon: "⚙️" },
]

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>("grower")

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set("role", selectedRole)
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassContainer intensity="heavy" padding="lg" grain className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Join <span className="gradient-text-sprout">SproutBox</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your account and start growing
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Role Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Select your role</label>
          <div className="grid grid-cols-3 gap-2">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${
                  selectedRole === role.value
                    ? "border-sprout-500/50 bg-sprout-500/10 text-foreground shadow-sm shadow-sprout-500/10"
                    : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.12] hover:bg-white/[0.04]"
                }`}
              >
                <span className="text-xl">{role.icon}</span>
                <span className="text-xs font-medium">{role.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form action={handleSubmit} className="space-y-4">
          <Input
            name="fullName"
            type="text"
            label="Full Name"
            placeholder="John Doe"
            variant="glass"
            required
          />
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            variant="glass"
            required
          />
          <Input
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            helperText="At least 6 characters"
            variant="glass"
            required
          />

          <MotionButton
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                </svg>
                Creating account…
              </span>
            ) : (
              "Create Account"
            )}
          </MotionButton>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-sprout-400 transition-colors hover:text-sprout-300"
          >
            Sign in
          </Link>
        </p>
      </GlassContainer>
    </motion.div>
  )
}
