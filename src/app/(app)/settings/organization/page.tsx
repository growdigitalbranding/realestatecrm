import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateIpAllowlist } from "./actions";

export default async function OrganizationSettingsPage() {
  const user = await requireUser();
  if (!can(user.role, "manageUsers")) redirect("/settings");

  const builder = await db.builder.findUniqueOrThrow({ where: { id: user.builderId } });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Organization</h1>
        <p className="text-sm text-muted-foreground">{builder.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>IP Allowlist</CardTitle>
          <CardDescription>
            One IP address per line. Use a trailing <code>*</code> to allow a prefix (e.g.{" "}
            <code>203.0.113.*</code>). Leave empty to allow access from any network.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateIpAllowlist} className="flex flex-col gap-3">
            <Textarea
              name="ipAllowlist"
              rows={6}
              placeholder="203.0.113.10&#10;198.51.100.*"
              defaultValue={builder.ipAllowlist.join("\n")}
            />
            <div>
              <Button type="submit" variant="secondary">
                Save Allowlist
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
