"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useState } from "react";
import { LogOut, Plus, Search } from "lucide-react";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useDismiss } from "@/components/ui/use-dismiss";
import { PRIMARY_ACTION, ROLE_LABEL, type Role } from "@/lib/nav";
import { NotificationsPanel } from "./NotificationsPanel";
import { ThemeToggle } from "./ThemeToggle";

interface TopBarProps {
  role: Role;
  userName: string;
  unread: number;
  onOpenSearch: () => void;
}

function UserMenu({ role, userName }: { role: Role; userName: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-no-global-loading
        onClick={() => setOpen((value) => !value)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        {userName?.[0]?.toUpperCase() || "U"}
      </button>
      {open && (
        <div className="panel absolute right-0 top-full z-50 mt-2 w-64 animate-sheet-in space-y-1 p-2 !bg-panel-solid shadow-pop !backdrop-blur-0">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink">{userName}</p>
            <p className="text-micro text-ink-muted">{ROLE_LABEL[role]}</p>
          </div>
          {/* Language is in the top bar on desktop; on phones it lives here. */}
          <div className="px-1 py-1 md:hidden">
            <LanguageToggle className="w-full justify-between" />
          </div>
          <Link
            href="/signout"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition-colors hover:bg-risk-soft hover:text-risk"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Link>
        </div>
      )}
    </div>
  );
}

export function TopBar({ role, userName, unread, onOpenSearch }: TopBarProps) {
  const action = PRIMARY_ACTION[role];

  return (
    <header className="panel sticky top-3 z-30 mx-3 mt-3 flex items-center gap-2 rounded-2xl px-3 py-2 sm:gap-3 lg:mx-6">
      {/* Brand mark for phones (the sidebar is desktop-only) */}
      <Link href="/" className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-brand/10 lg:hidden" aria-label="SproutBox">
        <Image src="/logo.png" alt="" fill sizes="36px" className="object-contain p-1.5" />
      </Link>

      <div className="min-w-0 flex-1">
        {/* Phones: icon button. Wider screens: the full search pill with the shortcut hint. */}
        <button
          type="button"
          data-no-global-loading
          onClick={onOpenSearch}
          aria-label="Search pages"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-inset/50 text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 sm:hidden"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          data-no-global-loading
          onClick={onOpenSearch}
          aria-label="Search pages"
          className="hidden h-10 w-full items-center gap-2 rounded-full border border-hairline bg-inset/50 px-4 text-left text-sm text-ink-muted transition-colors hover:border-ink-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 sm:flex"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">Search pages…</span>
          <kbd className="rounded-md border border-hairline px-1.5 py-0.5 text-micro">⌘K</kbd>
        </button>
      </div>

      <Link
        href={action.href}
        aria-label={action.label}
        title={action.label}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-ink shadow-panel transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        <Plus className="h-5 w-5" />
      </Link>

      <div className="hidden md:block">
        <LanguageToggle />
      </div>
      <ThemeToggle className="hidden sm:inline-flex" />
      <NotificationsPanel initialUnread={unread} />
      <UserMenu role={role} userName={userName} />
    </header>
  );
}
