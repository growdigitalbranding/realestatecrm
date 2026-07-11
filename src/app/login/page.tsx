import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm, LoginHeader } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-6 pt-6">
          <LoginHeader />
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
