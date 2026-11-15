"use client";

import { usePathname } from "next/navigation";
import { Globe2 } from "lucide-react";
import { languageOptions, type LanguageCode } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLanguage } from "./LanguageProvider";

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <label
      data-no-global-loading
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-panel/70 px-3 text-sm font-semibold text-ink transition-colors hover:border-ink-muted/50 focus-within:ring-2 focus-within:ring-brand/50",
        className
      )}
    >
      <Globe2 className="h-4 w-4 text-ink-soft" aria-hidden="true" />
      <span className="hidden text-xs uppercase tracking-wider text-ink-muted sm:inline">
        Language
      </span>
      <select
        data-i18n-ignore
        aria-label="Language"
        value={language}
        onChange={(event) => setLanguage(event.target.value as LanguageCode)}
        className="cursor-pointer bg-transparent text-sm font-bold text-ink outline-none"
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const DASHBOARD_PREFIXES = ["/admin", "/grower", "/restaurant"];

// Temporary: marketing and auth pages keep this floating toggle until they get
// their own chrome (Phase 1). Dashboards have the toggle in the top bar.
export function FloatingLanguageToggle() {
  const pathname = usePathname();
  if (DASHBOARD_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] hidden lg:block">
      <LanguageToggle />
    </div>
  );
}
