import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  RECEIVED: "muted",
  PROCESSED: "success",
  DUPLICATE: "warning",
  FAILED: "destructive",
};

export default async function WebhookLogsPage() {
  const user = await requireUser();
  if (!can(user.role, "manageApiKeys")) redirect("/settings");

  const logs = await db.webhookLog.findMany({
    where: { builderId: user.builderId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Webhook Logs</h1>
        <p className="text-sm text-muted-foreground">Recent inbound lead capture requests</p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">{log.source}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[log.status]}>{log.status}</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {log.leadId ? (
                    <Link href={`/leads/${log.leadId}`} className="text-primary hover:underline">
                      View lead
                    </Link>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={log.error ?? ""}>
                  {log.error ?? "-"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No webhook requests received yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
