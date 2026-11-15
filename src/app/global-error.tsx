"use client";

import { FatalErrorPanel } from "@/components/shared/FatalErrorPanel";
import "@/app/globals.css";

// Replaces the root layout when it fails, so it sets the theme attribute itself:
// the colour tokens only exist under [data-theme]. English only, because the
// language provider lives in the layout that just failed.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <FatalErrorPanel onRetry={reset} />
      </body>
    </html>
  );
}
