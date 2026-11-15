import { cn } from "@/lib/utils";
import { Panel } from "./panel";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-inset/80 motion-reduce:animate-none", className)} />;
}

export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-tile bg-panel/55 p-4">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-3 h-8 w-2/3" />
          <Skeleton className="mt-3 h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton({ className }: { className?: string }) {
  return (
    <Panel className={className}>
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="mt-4 h-24 w-full" />
    </Panel>
  );
}

// Shaped like a typical page: header, stat row, two panels.
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 space-y-4">
        <StatRowSkeleton />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <PanelSkeleton className="h-64" />
          <PanelSkeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}
