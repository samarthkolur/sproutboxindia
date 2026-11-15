import { cn } from "@/lib/utils";

// Master-detail: a main area and a narrower side panel (Verdelo "Cards", Grovia "Payroll").
// On small screens the side panel stacks under the main area.
export function DetailLayout({
  children,
  aside,
  asidePosition = "right",
  compact = false,
  className,
}: {
  children: React.ReactNode;
  aside: React.ReactNode;
  asidePosition?: "left" | "right";
  /** A narrower side panel (17rem instead of 24rem), for a list beside a wide working area. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 lg:gap-5",
        asidePosition === "right"
          ? compact ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]"
          : compact ? "lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]",
        className
      )}
    >
      {asidePosition === "left" ? <div className="min-w-0 space-y-4">{aside}</div> : null}
      <div className="min-w-0 space-y-4">{children}</div>
      {asidePosition === "right" ? <div className="min-w-0 space-y-4">{aside}</div> : null}
    </div>
  );
}
