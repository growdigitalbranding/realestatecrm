import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="outline" size="sm">
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      <Card className="divide-y divide-border">
        {notifications.map((n) => (
          <div key={n.id} className={`flex items-start justify-between gap-4 p-4 ${!n.isRead ? "bg-secondary/40" : ""}`}>
            <Link href={n.link ?? "#"} className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{n.title}</span>
                {!n.isRead && <Badge variant="default">New</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
            </Link>
            {!n.isRead && (
              <form action={markNotificationRead.bind(null, n.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  Mark read
                </Button>
              </form>
            )}
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">No notifications yet.</p>
        )}
      </Card>
    </div>
  );
}
