"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useDismiss } from "@/components/ui/use-dismiss";
import { cn } from "@/lib/utils";
import { MARKETING_LINKS } from "./links";

export function MarketingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const rootRef = useDismiss<HTMLDivElement>(open, close);

  return (
    <header className="sticky top-3 z-40 px-3 sm:px-4">
      <div ref={rootRef} className="relative mx-auto max-w-6xl">
        <div className="panel flex h-14 items-center justify-between gap-3 !rounded-full pl-4 pr-2">
          <Link href="/" aria-label="SproutBox home" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
            <BrandLogo />
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            {MARKETING_LINKS.map((link) => {
              const active = link.href === pathname;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                    active ? "bg-inset text-ink" : "text-ink-soft hover:text-ink"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            <LanguageToggle className="hidden md:inline-flex" />
            <ThemeToggle className="hidden md:inline-flex" />
            <Button asChild variant="ghost" className="hidden rounded-full text-ink-soft hover:bg-inset/70 hover:text-ink sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/register">Get started</Link>
            </Button>
            <button
              type="button"
              data-no-global-loading
              aria-expanded={open}
              aria-controls="marketing-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-inset/70 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div id="marketing-menu" className="panel absolute inset-x-0 top-[calc(100%+8px)] animate-sheet-in space-y-1 !bg-panel-solid p-3 !backdrop-blur-0 md:hidden">
            {MARKETING_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="block rounded-tile px-4 py-3 text-base font-medium text-ink hover:bg-inset/70"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/login" onClick={close} className="block rounded-tile px-4 py-3 text-base font-medium text-ink hover:bg-inset/70 sm:hidden">
              Sign in
            </Link>
            <div className="flex items-center gap-2 border-t border-hairline/70 pt-3">
              <LanguageToggle className="flex-1 justify-between" />
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
