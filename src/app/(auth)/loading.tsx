import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-4">
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="mt-6 h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
