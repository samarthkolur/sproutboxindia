import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

// Legacy container kept so unconverted pages pick up the new panel look.
// New code should use <Panel> from components/ui/panel.
export function GlassCard({
  children,
  className,
  hover = false,
  padding = "md",
}: GlassCardProps) {
  const paddings = {
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-5 sm:p-8",
  };

  return (
    <div
      className={cn(
        "panel",
        paddings[padding],
        hover && "cursor-pointer transition-colors hover:bg-panel/80",
        className
      )}
    >
      {children}
    </div>
  );
}
