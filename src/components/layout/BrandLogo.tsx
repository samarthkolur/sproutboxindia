import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  markClassName,
  textClassName,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className={cn("relative block h-9 w-9 shrink-0", markClassName)}>
        <Image src="/logo.png" alt="" fill sizes="40px" className="object-contain" priority />
      </span>
      <span data-i18n-ignore className={cn("font-semibold tracking-tight text-ink", textClassName ?? "text-lg")}>
        Sprout<span className="text-brand">Box</span>
      </span>
    </span>
  );
}
