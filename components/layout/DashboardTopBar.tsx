"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, User, Menu } from "lucide-react"
import { signOut } from "@/lib/auth"

interface DashboardTopBarProps {
  profile: {
    full_name: string | null
    email: string
    role: string
  }
}

export default function DashboardTopBar({ profile }: DashboardTopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/10 bg-black/40 px-4 backdrop-blur-3xl sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile toggle (will be connected to a context later if needed, statically shown for now) */}
      <button type="button" className="-m-2.5 p-2.5 text-muted-foreground md:hidden hover:text-white transition-colors">
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-white/10 md:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end items-center">
        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="flex items-center gap-x-3 rounded-full hover:bg-white/5 p-1 transition-colors outline-none"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
          >
            <div className="h-8 w-8 rounded-full bg-sprout-500/20 text-sprout-400 flex items-center justify-center font-bold text-sm border border-sprout-500/30">
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
            </div>
            <span className="hidden lg:flex lg:items-center">
              <span className="text-sm font-semibold leading-6 text-white" aria-hidden="true">
                {profile.full_name || profile.email}
              </span>
            </span>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 z-50 mt-2.5 w-56 transform origin-top-right rounded-xl border border-white/[0.06] bg-[#0a0a0a] shadow-2xl ring-1 ring-white/5 py-2"
              >
                <div className="px-4 py-3 border-b border-white/[0.06] mb-2">
                  <p className="text-sm font-medium text-white">{profile.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                </div>

                <div className="px-2">
                  <div className="flex px-3 py-2 text-sm text-muted-foreground gap-3 items-center rounded-md cursor-default">
                    <User className="h-4 w-4" />
                    <span className="capitalize text-xs font-bold tracking-wider">{profile.role}</span>
                  </div>

                  <form action={signOut} className="mt-1">
                    <button
                      type="submit"
                      className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    >
                      <LogOut className="h-4 w-4 text-red-400 group-hover:text-red-300" />
                      Sign Out
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
