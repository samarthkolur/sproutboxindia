"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Panel padding="lg" className="mx-auto max-w-lg text-center">
      <h1 className="text-2xl font-light text-ink">This page could not load</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Something went wrong while fetching your data. Try again, or go back to your dashboard.
      </p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        <Button onClick={reset} className="rounded-full">
          Try again
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </Panel>
  );
}
