import Link from "next/link";
import { Button } from "@/components/ui/button";

// The panel shown when the whole app fails to render. Kept separate from
// global-error.tsx (which must also render <html> and <body>) so it can be tested.
export function FatalErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="app-canvas grid min-h-screen place-items-center px-4">
      <div role="alert" className="panel max-w-md p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-soft">The request could not be completed. Please try again.</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" onClick={onRetry} className="rounded-full">
            Try again
          </Button>
          <Button asChild variant="outline" className="rounded-full border-hairline bg-transparent">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
