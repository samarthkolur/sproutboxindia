"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { pageview } from "@/lib/gtag";

function PageviewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    // The base gtag config script (send_page_view: true) already fires
    // the pageview for the very first load before this effect can run,
    // so the first URL this effect ever sees should just be recorded,
    // not re-sent. Comparing against the last-tracked URL (rather than
    // a simple "is this the first run" flag) also makes this safe under
    // React 18 Strict Mode, which double-invokes effects in dev and
    // would otherwise fire a duplicate pageview for the same URL.
    if (lastTracked.current === url) return;
    const isFirstRun = lastTracked.current === null;
    lastTracked.current = url;
    if (isFirstRun) return;

    pageview(url);
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalyticsPageview() {
  return (
    <Suspense fallback={null}>
      <PageviewTrackerInner />
    </Suspense>
  );
}
