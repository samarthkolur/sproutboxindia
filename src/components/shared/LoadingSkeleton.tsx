import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-inset/80 motion-reduce:animate-none", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="panel p-6">
      <LoadingSkeleton className="h-5 w-1/3" />
      <LoadingSkeleton className="mt-4 h-9 w-2/3" />
      <LoadingSkeleton className="mt-6 h-24 w-full" />
    </div>
  );
}
