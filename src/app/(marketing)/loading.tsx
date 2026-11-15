import { PanelSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div role="status" aria-label="Loading page" className="mx-auto max-w-6xl space-y-6 px-4 py-16 sm:px-6">
      <Skeleton className="h-12 w-3/4 max-w-xl" />
      <Skeleton className="h-5 w-1/2 max-w-md" />
      <PanelSkeleton className="mt-8" />
    </div>
  );
}
