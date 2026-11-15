import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-canvas flex min-h-screen flex-col px-4 py-4 sm:py-6">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-2 text-sm text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to SproutBox
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center py-8">
        <div className="panel w-full max-w-[460px] p-6 sm:p-9">{children}</div>
      </main>
    </div>
  );
}
