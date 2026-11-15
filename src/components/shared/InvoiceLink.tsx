import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

// A download link to one of the PDF documents under /api/invoices. A plain anchor with
// `download`, so the browser saves the file instead of navigating away.
export function InvoiceLink({
  href,
  label,
  ariaLabel,
  size = "md",
  className,
}: {
  href: string;
  label: string;
  /** Say which document, when the same label repeats down a list. */
  ariaLabel?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <a
      href={href}
      download
      data-no-global-loading
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-hairline bg-panel/60 font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm",
        className
      )}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}

export const invoiceHref = {
  restaurant: (orderId: string) => `/api/invoices/restaurant/${orderId}`,
  grower: (taskId: string) => `/api/invoices/grower/${taskId}`,
  platform: (orderId: string) => `/api/invoices/platform/${orderId}`,
};
