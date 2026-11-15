import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchPill({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex h-10 min-w-0 items-center gap-2 rounded-full border border-hairline bg-panel/60 px-4 text-sm focus-within:ring-2 focus-within:ring-brand/50",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full min-w-0 bg-transparent text-ink outline-none placeholder:text-ink-muted"
      />
    </label>
  );
}
