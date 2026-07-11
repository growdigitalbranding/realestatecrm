"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "@/app/(app)/notifications/actions";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-md border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => startTransition(() => markAllNotificationsRead())}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-auto">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "/notifications"}
                onClick={() => {
                  setOpen(false);
                  if (!n.isRead) startTransition(() => markNotificationRead(n.id));
                }}
                className={cn("block border-b border-border px-3 py-2.5 last:border-0 hover:bg-muted", !n.isRead && "bg-secondary/40")}
              >
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.message}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTime(n.createdAt)}</div>
              </Link>
            ))}
            {notifications.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
            )}
          </div>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border p-2 text-center text-sm text-primary hover:bg-muted"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}
