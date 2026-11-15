"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchPill } from "@/components/ui/search-pill";

// A search box whose text lives in the URL (?q=), so a filtered list can be shared, reloaded
// and reached with the back button. It waits for a pause in typing before it searches.
export function UrlSearch({ query, placeholder, ariaLabel, className }: { query: string; placeholder: string; ariaLabel: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [text, setText] = useState(query);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (text.trim()) next.set("q", text.trim());
      else next.delete("q");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <SearchPill value={text} onChange={setText} placeholder={placeholder} ariaLabel={ariaLabel} className={className} />;
}
