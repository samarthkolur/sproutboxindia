"use client";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";
import "@/app/globals.css";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center bg-[#F8FAF7] px-4">
          <GlassCard className="max-w-md text-center">
            <h1 className="text-2xl font-black text-text-primary">Something went wrong</h1>
            <p className="mt-2 text-sm text-text-muted">The request could not be completed. Please try again.</p>
            <Button className="mt-5 bg-sprout-800 text-white hover:bg-sprout-900" onClick={reset}>
              Try again
            </Button>
          </GlassCard>
        </main>
      </body>
    </html>
  );
}
