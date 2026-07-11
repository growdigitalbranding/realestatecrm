import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { totpAuthUri } from "@/lib/totp";
import { startTwoFactorEnrollment, disableTwoFactor, revokeAllSessions } from "./actions";
import { Confirm2faForm } from "./confirm-2fa-form";

export default async function SecuritySettingsPage() {
  const user = await requireUser();
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });

  const pendingEnrollment = !!record.twoFactorSecret && !record.twoFactorEnabled;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Security</h1>
        <p className="text-sm text-muted-foreground">Two-factor authentication and session management</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Two-Factor Authentication</CardTitle>
            <Badge variant={record.twoFactorEnabled ? "success" : "muted"}>
              {record.twoFactorEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <CardDescription>
            Require a time-based one-time code from an authenticator app (Google Authenticator, Authy, 1Password) in
            addition to your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {record.twoFactorEnabled && (
            <form action={disableTwoFactor}>
              <Button type="submit" variant="outline">
                Disable 2FA
              </Button>
            </form>
          )}

          {!record.twoFactorEnabled && !pendingEnrollment && (
            <form action={startTwoFactorEnrollment}>
              <Button type="submit">Enable 2FA</Button>
            </form>
          )}

          {pendingEnrollment && record.twoFactorSecret && (
            <div className="flex flex-col gap-3 rounded-md border border-border p-4">
              <p className="text-sm">
                Add this account to your authenticator app using the manual entry code below, then enter the
                6-digit code it generates.
              </p>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Manual entry code</span>
                <code className="w-fit rounded bg-muted px-2 py-1 text-sm tracking-widest">{record.twoFactorSecret}</code>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Setup URI</span>
                <code className="break-all rounded bg-muted px-2 py-1 text-xs">
                  {totpAuthUri(record.twoFactorSecret, record.email)}
                </code>
              </div>
              <Confirm2faForm />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>Sign out of this account everywhere, including this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={revokeAllSessions}>
            <Button type="submit" variant="destructive">
              Sign out all sessions
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
