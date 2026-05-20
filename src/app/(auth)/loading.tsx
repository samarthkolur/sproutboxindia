import { CardSkeleton } from "@/components/shared/LoadingSkeleton";

export default function AuthLoading() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <CardSkeleton />
    </main>
  );
}
