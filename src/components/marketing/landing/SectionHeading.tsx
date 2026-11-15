import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <span className="inline-flex rounded-full bg-leaf-soft px-3 py-1 text-micro font-medium text-ink">{eyebrow}</span>
      <h2 className="mt-4 text-3xl font-light leading-tight tracking-tight text-ink text-balance sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-base text-ink-soft sm:text-lg">{subtitle}</p> : null}
    </div>
  );
}
