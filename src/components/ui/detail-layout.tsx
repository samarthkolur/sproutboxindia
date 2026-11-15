import { cn } from "@/lib/utils";

// Master-detail: a main area and a narrower side panel (Verdelo "Cards", Grovia "Payroll").
// On small screens the side panel stacks under the main area.
export function DetailLayout({
  children,
  aside,
  asidePosition = "right",
  className,
}: {
  children: React.ReactNode;
  aside: React.ReactNode;
  asidePosition?: "left" | "right";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 lg:gap-5",
        asidePosition === "right"
          ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]"
          : "lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]",
        className
      )}
    >
      {asidePosition === "left" ? <div className="min-w-0 space-y-4">{aside}</div> : null}
      <div className="min-w-0 space-y-4">{children}</div>
      {asidePosition === "right" ? <div className="min-w-0 space-y-4">{aside}</div> : null}
    </div>
  );
}
