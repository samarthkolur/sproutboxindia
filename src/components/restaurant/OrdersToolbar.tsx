"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchPill } from "@/components/ui/search-pill";
import { SegmentedControl } from "@/components/ui/segmented-control";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "amount", label: "Highest" },
];

// Search and sort for the orders list. Both live in the URL (next to the status filter), so a
// filtered list can be shared, reloaded and reached with the back button.
export function OrdersToolbar({ query, sort }: { query: string; sort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [text, setText] = useState(query);
  const first = useRef(true);

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value && !(key === "sort" && value === "newest")) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Wait for a pause in typing before searching.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(() => update({ q: text.trim() }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <SearchPill value={text} onChange={setText} placeholder="Search by order or crop" ariaLabel="Search orders" className="min-w-[14rem] flex-1 sm:max-w-sm" />
      <SegmentedControl ariaLabel="Sort orders" options={SORTS} value={sort} onChange={(value) => update({ sort: value })} />
    </div>
  );
}
