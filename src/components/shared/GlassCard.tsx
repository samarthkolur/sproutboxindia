import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

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
        "glass-card",
        paddings[padding],
        hover && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
