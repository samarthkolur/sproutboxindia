"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Wallet,
  UserCircle,
  ShoppingCart,
  Package,
  RotateCw,
  Settings2,
  Target,
  CheckCircle2,
  Truck,
  BarChart3,
  CreditCard,
  Warehouse,
  Users,
  Store,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const roleNavItems: Record<string, NavItem[]> = {
  GROWER: [
    { label: "Dashboard", href: "/grower/dashboard", icon: LayoutDashboard },
    { label: "My Tasks", href: "/grower/tasks", icon: ClipboardList },
    { label: "Earnings", href: "/grower/earnings", icon: Wallet },
    { label: "Profile", href: "/grower/profile", icon: UserCircle },
  ],
  RESTAURANT: [
    { label: "Dashboard", href: "/restaurant/dashboard", icon: LayoutDashboard },
    { label: "New Order", href: "/restaurant/order/new", icon: ShoppingCart },
    { label: "My Orders", href: "/restaurant/orders", icon: Package },
    { label: "Subscriptions", href: "/restaurant/subscriptions", icon: RotateCw },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Demand Engine", href: "/admin/demand", icon: Settings2 },
    { label: "Allocations", href: "/admin/allocate", icon: Target },
    { label: "QC Review", href: "/admin/qc", icon: CheckCircle2 },
    { label: "Hubs", href: "/admin/hubs", icon: Warehouse },
    { label: "Growers", href: "/admin/growers", icon: Users },
    { label: "Restaurants", href: "/admin/restaurants", icon: Store },
    { label: "Deliveries", href: "/admin/deliveries", icon: Truck },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "Payouts", href: "/admin/payouts", icon: CreditCard },
  ],
};

interface SidebarProps {
  userName: string;
  userRole: string;
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = roleNavItems[userRole] || [];

  const roleLabels: Record<string, string> = {
    GROWER: "Grower",
    RESTAURANT: "Restaurant",
    ADMIN: "Admin",
  };

  const roleColors: Record<string, string> = {
    GROWER: "from-sprout-600 to-sprout-800",
    RESTAURANT: "from-blue-600 to-blue-800",
    ADMIN: "from-purple-600 to-purple-800",
  };

  const sidebarContent = (
    <div className="relative z-10 flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-sprout-200/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-sprout-700 to-sprout-900 rounded-xl flex items-center justify-center shadow-lg shadow-sprout-800/20">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight">
            Sprout<span className="text-sprout-800">Box</span>
          </span>
        </div>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-sprout-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role tag */}
      <div className="px-6 pt-4 pb-2">
        <span
          className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider bg-gradient-to-r",
            roleColors[userRole] || "from-gray-600 to-gray-800"
          )}
        >
          {roleLabels[userRole] || userRole}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-sprout-800 text-white shadow-md shadow-sprout-800/20"
                  : "text-text-secondary hover:bg-sprout-50 hover:text-sprout-800"
              )}
            >
              {/* Active indicator glow */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sprout-400 rounded-r-full shadow-[0_0_12px_rgba(82,183,136,0.6)]" />
              )}
              <Icon
                className={cn(
                  "w-[18px] h-[18px] flex-shrink-0",
                  !isActive && "group-hover:scale-110 transition-transform duration-200"
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-sprout-200/30">
        <div className="flex items-center gap-3 px-2">
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold bg-gradient-to-br",
              roleColors[userRole] || "from-gray-600 to-gray-800"
            )}
          >
            {userName?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {userName}
            </p>
            <p className="text-[11px] text-text-muted">
              {roleLabels[userRole] || userRole}
            </p>
          </div>
          <Link
            href="/signout"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 glass-card flex items-center justify-center rounded-xl shadow-lg"
      >
        <Menu className="w-5 h-5 text-text-primary" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 w-[280px] z-50 transform transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-r border-white/40" />
        <div className="absolute inset-0 bg-dots opacity-20" />
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col fixed inset-y-0 left-0 z-30">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-r border-white/40" />
        <div className="absolute inset-0 bg-dots opacity-20" />
        {sidebarContent}
      </aside>
    </>
  );
}
