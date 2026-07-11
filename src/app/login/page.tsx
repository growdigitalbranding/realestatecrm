import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm, LoginHeader } from "./login-form";

const REASON_MESSAGES: Record<string, string> = {
  session_revoked: "Your session was signed out remotely. Please sign in again.",
  ip_blocked: "Your network is not on this organization's allowed IP list.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  const params = await searchParams;
  const reasonMessage = params.reason ? REASON_MESSAGES[params.reason] : undefined;

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-6 pt-6">
          <LoginHeader />
          {reasonMessage && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{reasonMessage}</p>
          )}
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
