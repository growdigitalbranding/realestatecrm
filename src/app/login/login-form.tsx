"use client";

import { useActionState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { authenticate } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          defaultValue="sales@vskhousingindia.com"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
        />
      </div>
      {errorMessage && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
      <Button type="submit" disabled={isPending} className="mt-1">
        {isPending && <Loader2 className="animate-spin" />}
        Sign in
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Demo password for all seeded users: <code className="font-mono">Password123!</code>
      </p>
    </form>
  );
}

export function LoginHeader() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Building2 className="size-6" />
      </div>
      <h1 className="text-xl font-semibold">RealtyFlow CRM</h1>
      <p className="text-sm text-muted-foreground">
        Sign in to manage leads, sales and marketing
      </p>
    </div>
  );
}
