"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Button } from "@/components/ui/button";

// A signed-in person goes back to their own dashboard (/dashboard sends each role
// to the right one); a visitor goes to the landing page.
//
// The session is read in the browser on purpose. Reading it on the server
// (auth() in not-found.tsx) makes Next render EVERY page dynamically, including
// the static landing and auth pages, so the visitor link is the default and the
// dashboard link swaps in once the session answers.
export function NotFoundView() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((session) => {
        if (!cancelled) setSignedIn(Boolean(session?.user));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="app-canvas flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel w-full max-w-md p-8 text-center sm:p-10">
        <BrandLogo className="mb-8 justify-center" markClassName="h-10 w-10" textClassName="text-xl" />
        <p aria-hidden="true" className="text-6xl font-light tracking-tight text-ink-muted">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-sm text-ink-soft">The link may be broken, or the page may have moved.</p>
        <Button asChild size="lg" className="mt-8 w-full rounded-full">
          <Link href={signedIn ? "/dashboard" : "/"}>{signedIn ? "Go to your dashboard" : "Back to home"}</Link>
        </Button>
      </div>
    </main>
  );
}
