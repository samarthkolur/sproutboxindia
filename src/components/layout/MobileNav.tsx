"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, User, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/grower/dashboard", label: "Home", icon: Home },
  { href: "/grower/tasks", label: "Tasks", icon: ListChecks },
  { href: "/grower/earnings", label: "Earnings", icon: Wallet },
  { href: "/grower/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border border-white/60 bg-white/85 p-2 shadow-xl backdrop-blur-xl lg:hidden" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center rounded-xl text-[11px] font-semibold",
              active ? "bg-sprout-800 text-white" : "text-text-muted"
            )}
          >
            <Icon className="mb-0.5 h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
