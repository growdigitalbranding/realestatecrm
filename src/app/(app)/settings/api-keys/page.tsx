import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { CreateKeyForm } from "./create-key-form";
import { revokeApiKey } from "./actions";

export default async function ApiKeysPage() {
  const user = await requireUser();
  if (!can(user.role, "manageApiKeys")) redirect("/settings");

  const keys = await db.apiKey.findMany({
    where: { builderId: user.builderId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">API Keys</h1>
        <p className="text-sm text-muted-foreground">
          Used to authenticate <code>POST /api/leads/webhook</code> and the REST API with an{" "}
          <code>x-api-key</code> header.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate a new key</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateKeyForm />
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell className="font-mono text-xs">{key.keyPrefix}…</TableCell>
                <TableCell>
                  <Badge variant={key.isActive ? "success" : "muted"}>{key.isActive ? "Active" : "Revoked"}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {key.lastUsedAt ? formatDateTime(key.lastUsedAt) : "Never"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDateTime(key.createdAt)}</TableCell>
                <TableCell>
                  {key.isActive && (
                    <form action={revokeApiKey.bind(null, key.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        Revoke
                      </Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {keys.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No API keys yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
