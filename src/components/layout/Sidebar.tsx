"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NAV_GROUPS,
  ROLE_LABEL,
  isNavActive,
  type NavBadges,
  type NavItem,
  type Role,
} from "@/lib/nav";
import type { PinnedCard } from "@/lib/shell-data";

interface SidebarProps {
  role: Role;
  userName: string;
  workspace: string;
  badges: NavBadges;
  pinned: PinnedCard;
  collapsed: boolean;
  onToggle: () => void;
}

function NavLink({
  item,
  active,
  count,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  count: number;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
        collapsed && "justify-center px-0",
        // V1: the active item is the one solid fill in the sidebar.
        active
          ? "bg-brand text-brand-ink shadow-panel"
          : "text-ink-soft hover:bg-inset/70 hover:text-ink"
      )}
    >
      {item.step ? (
        <span
          aria-hidden="true"
          className={cn(
            "w-3 shrink-0 text-center text-micro tabular-nums",
            collapsed && "hidden",
            active ? "text-brand-ink/70" : "text-ink-muted"
          )}
        >
          {item.step}
        </span>
      ) : null}
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.8} />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
      {count > 0 && (
        <span
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-micro font-semibold tabular-nums",
            collapsed && "absolute right-1 top-1 h-4 min-w-4 px-1",
            active ? "bg-brand-ink/20 text-brand-ink" : "bg-leaf-soft text-good"
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ role, userName, workspace, badges, pinned, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const groups = NAV_GROUPS[role];

  return (
    <aside
      className={cn(
        "panel fixed bottom-3 left-3 top-3 z-30 hidden flex-col rounded-shell transition-[width] duration-200 lg:flex",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div className={cn("flex items-center gap-3 px-4 pb-3 pt-4", collapsed && "flex-col px-2")}>
        <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-brand/10 p-1.5">
          <Image src="/logo.png" alt="" fill sizes="40px" className="object-contain p-1" priority />
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold leading-tight text-ink">SproutBox</p>
            <p className="truncate text-micro text-ink-muted">{workspace}</p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-no-global-loading
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-inset/70 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="scrollbar-none flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {groups.map((group, index) => (
          <div key={group.label ?? `group-${index}`} className="space-y-1">
            {group.label && !collapsed && (
              <p className="px-3.5 pb-1 text-micro font-medium uppercase tracking-wider text-ink-muted">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isNavActive(pathname, item.href)}
                count={item.badge ? badges[item.badge] ?? 0 : 0}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* V6: the pinned card says what to do next without opening a page. */}
      {!collapsed && (
        <Link
          href={pinned.href}
          className="mx-3 mb-3 block rounded-2xl bg-inset/80 p-3.5 transition-colors hover:bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <p className="text-micro text-ink-muted">{pinned.label}</p>
          <p className="mt-0.5 text-2xl font-medium leading-tight text-ink">{pinned.value}</p>
          <p className="mt-0.5 text-micro text-ink-soft">{pinned.caption}</p>
        </Link>
      )}

      {/* User chip */}
      <div className={cn("flex items-center gap-3 border-t border-hairline/70 px-4 py-3", collapsed && "justify-center px-2")}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-ink">
          {userName?.[0]?.toUpperCase() || "U"}
        </span>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{userName}</p>
              <p className="truncate text-micro text-ink-muted">{ROLE_LABEL[role]}</p>
            </div>
            <Link
              href="/signout"
              aria-label="Sign out"
              title="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-risk-soft hover:text-risk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
