"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { LogOut, MoreHorizontal, X } from "lucide-react";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { cn } from "@/lib/utils";
import {
  DOCK_HREFS,
  NAV_GROUPS,
  flatNav,
  isNavActive,
  type NavBadges,
  type NavItem,
  type Role,
} from "@/lib/nav";
import { ThemeToggle } from "./ThemeToggle";
import { useDismiss } from "@/components/ui/use-dismiss";

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-risk px-1 text-micro font-semibold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function BottomDock({ role, badges }: { role: Role; badges: NavBadges }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const sheetRef = useDismiss<HTMLDivElement>(moreOpen, closeMore);

  const all = flatNav(role);
  const dockItems = DOCK_HREFS[role]
    .map((href) => all.find((item) => item.href === href))
    .filter((item): item is NavItem => Boolean(item));
  const moreActive = all.some(
    (item) => !DOCK_HREFS[role].includes(item.href) && isNavActive(pathname, item.href)
  );
  const moreCount = all
    .filter((item) => !DOCK_HREFS[role].includes(item.href))
    .reduce((sum, item) => sum + (item.badge ? badges[item.badge] ?? 0 : 0), 0);

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="panel fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-1 rounded-full p-1.5 lg:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {dockItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          const count = item.badge ? badges[item.badge] ?? 0 : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
              className={cn(
                "relative flex min-w-0 items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium transition-[flex-grow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                // Only the active item shows its label: five labels never fit
                // on a phone, least of all in Kannada.
                active ? "flex-[2.2] bg-brand px-3 text-brand-ink" : "flex-1 px-1 text-ink-soft"
              )}
            >
              <span className="relative shrink-0">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                {!active && <Badge count={count} />}
              </span>
              {active && <span className="min-w-0 truncate">{item.label}</span>}
            </Link>
          );
        })}
        <button
          type="button"
          data-no-global-loading
          onClick={() => setMoreOpen(true)}
          aria-label="More"
          className={cn(
            "relative flex min-w-0 flex-1 items-center justify-center rounded-full px-1 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
            moreActive ? "bg-brand text-brand-ink" : "text-ink-soft"
          )}
        >
          <span className="relative">
            <MoreHorizontal className="h-5 w-5" />
            {!moreActive && <Badge count={moreCount} />}
          </span>
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-ink/30 backdrop-blur-sm lg:hidden">
          <div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="More"
            className="panel max-h-[80vh] w-full animate-sheet-in overflow-y-auto rounded-b-none !bg-panel-solid p-4 pb-8 !backdrop-blur-0"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-semibold text-ink">More</p>
              <button
                type="button"
                data-no-global-loading
                onClick={closeMore}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-inset text-ink-soft"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {NAV_GROUPS[role].map((group, index) => (
                <div key={group.label ?? `g-${index}`} className="space-y-1">
                  {group.label && (
                    <p className="px-3 text-micro font-medium uppercase tracking-wider text-ink-muted">{group.label}</p>
                  )}
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isNavActive(pathname, item.href);
                    const count = item.badge ? badges[item.badge] ?? 0 : 0;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMore}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
                          active ? "bg-brand text-brand-ink" : "text-ink-soft hover:bg-inset/70"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                        <span className="flex-1">{item.label}</span>
                        {count > 0 && (
                          <span className={cn("rounded-full px-2 py-0.5 text-micro font-semibold", active ? "bg-brand-ink/20" : "bg-leaf-soft text-good")}>
                            {count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-hairline/70 pt-4">
              <LanguageToggle className="flex-1 justify-between" />
              <ThemeToggle />
              <Link
                href="/signout"
                aria-label="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-ink-soft hover:bg-risk-soft hover:text-risk"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
