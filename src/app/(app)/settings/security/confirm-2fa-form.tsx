"use client";

import { useActionState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { confirmTwoFactorEnrollment } from "./actions";

export function Confirm2faForm() {
  const [error, formAction, isPending] = useActionState(confirmTwoFactorEnrollment, undefined);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Enter the 6-digit code</label>
        <Input name="code" inputMode="numeric" maxLength={6} placeholder="123456" required className="w-40" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
        Confirm & Enable
      </Button>
      {error && <p className="ml-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
