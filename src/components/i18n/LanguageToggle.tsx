"use client";

import { Globe2 } from "lucide-react";
import { languageOptions, type LanguageCode } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLanguage } from "./LanguageProvider";

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <label
      data-i18n-ignore
      data-no-global-loading
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl border border-sprout-200/70 bg-white/90 px-3 text-sm font-semibold text-text-primary shadow-lg shadow-sprout-900/5 backdrop-blur-xl transition-colors hover:border-sprout-300",
        className
      )}
    >
      <Globe2 className="h-4 w-4 text-sprout-800" aria-hidden="true" />
      <span className="hidden text-xs uppercase tracking-wider text-text-muted sm:inline">
        Language
      </span>
      <select
        aria-label="Language"
        value={language}
        onChange={(event) => setLanguage(event.target.value as LanguageCode)}
        className="cursor-pointer bg-transparent text-sm font-bold text-sprout-900 outline-none"
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

export function FloatingLanguageToggle() {
  return (
    <div className="fixed bottom-4 right-4 z-[70]">
      <LanguageToggle />
    </div>
  );
}
