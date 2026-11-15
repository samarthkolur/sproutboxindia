"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useDismiss } from "@/components/ui/use-dismiss";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function NotificationsPanel({ initialUnread }: { initialUnread: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [unread, setUnread] = useState(initialUnread);
  const [error, setError] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(false);
    fetch("/api/notifications", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad response"))))
      .then((body) => {
        if (cancelled) return;
        const list: NotificationItem[] = body.data ?? [];
        setItems(list);
        setUnread(list.filter((item) => !item.read).length);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function markAllRead() {
    setItems((current) => current?.map((item) => ({ ...item, read: true })) ?? current);
    setUnread(0);
    try {
      await fetch("/api/notifications/read", { method: "PATCH" });
    } catch {
      // The list already looks read; the next open re-syncs with the server.
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-no-global-loading
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-panel/60 text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-panel-solid" />
        )}
      </button>

      {open && (
        <div className="panel absolute right-0 top-full z-50 mt-2 w-[min(92vw,380px)] animate-sheet-in overflow-hidden !bg-panel-solid shadow-pop !backdrop-blur-0">
          <div className="flex items-center justify-between border-b border-hairline/70 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                data-no-global-loading
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-micro font-medium text-ink-soft transition-colors hover:bg-inset hover:text-ink"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {error ? (
              <p className="px-4 py-8 text-center text-sm text-ink-soft">
                Could not load notifications. Close this and try again.
              </p>
            ) : items === null ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-soft">No notifications yet</p>
            ) : (
              <ul className="divide-y divide-hairline/60">
                {items.map((item) => (
                  <li key={item.id} className={cn("px-4 py-3", !item.read && "bg-leaf-soft/40")}>
                    <div className="flex items-start gap-2">
                      {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{item.title}</p>
                        <p className="mt-0.5 text-sm text-ink-soft">{item.message}</p>
                        <p className="mt-1 text-micro text-ink-muted">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
