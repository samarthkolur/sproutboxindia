"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { flatNav, type Role } from "@/lib/nav";

// V1 of the palette searches pages only. Orders and growers come later
// (they need a search API). Matching is on the English labels.
export function CommandPalette({
  role,
  open,
  onClose,
}: {
  role: Role;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const items = flatNav(role);
    return needle ? items.filter((item) => item.label.toLowerCase().includes(needle)) : items;
  }, [query, role]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setIndex(0), [query]);

  if (!open) return null;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndex((value) => Math.min(value + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndex((value) => Math.max(value - 1, 0));
    } else if (event.key === "Enter" && results[index]) {
      go(results[index].href);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-ink/30 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Search pages"
    >
      <div className="panel w-full max-w-lg animate-sheet-in overflow-hidden !bg-panel-solid shadow-pop !backdrop-blur-0" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b border-hairline/70 px-4 py-3">
          <Search className="h-4 w-4 text-ink-muted" />
          <input
            ref={inputRef}
            data-i18n-ignore
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages…"
            aria-label="Search pages"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          <kbd className="rounded-md border border-hairline px-1.5 py-0.5 text-micro text-ink-muted">Esc</kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-ink-soft">No pages match</li>
          ) : (
            results.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={item.href} role="option" aria-selected={i === index}>
                  <button
                    type="button"
                    data-no-global-loading
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setIndex(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      i === index ? "bg-brand text-brand-ink" : "text-ink-soft"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {i === index && <CornerDownLeft className="h-3.5 w-3.5" />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
