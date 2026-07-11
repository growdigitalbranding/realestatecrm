import Link from "next/link";
import { KeyRound, Webhook, ShieldCheck, Building2 } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function SettingsPage() {
  const user = await requireUser();
  const isAdmin = can(user.role, "manageApiKeys");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Security, API access and integrations</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SettingsCard
          href="/settings/security"
          icon={ShieldCheck}
          title="Security"
          description="Two-factor authentication and active sessions"
        />
        {isAdmin && (
          <>
            <SettingsCard
              href="/settings/api-keys"
              icon={KeyRound}
              title="API Keys"
              description="Manage keys used for lead capture and the REST API"
            />
            <SettingsCard
              href="/settings/webhooks"
              icon={Webhook}
              title="Webhook Logs"
              description="Inspect inbound lead ingestion requests"
            />
            <SettingsCard
              href="/settings/organization"
              icon={Building2}
              title="Organization"
              description="IP allowlist and company-wide restrictions"
            />
          </>
        )}
      </div>
    </div>
  );
}

function SettingsCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Icon className="size-4.5" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </Link>
  );
}
