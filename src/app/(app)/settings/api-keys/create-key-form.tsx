"use client";

import { useActionState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createApiKey } from "./actions";

export function CreateKeyForm() {
  const [rawKey, formAction, isPending] = useActionState(createApiKey, null);

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Key name</label>
          <Input name="name" placeholder="e.g. Website Lead Form" required className="w-64" />
        </div>
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
          Generate Key
        </Button>
      </form>
      {rawKey && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-900">Copy this key now — it won&apos;t be shown again.</p>
          <code className="mt-1 block break-all rounded bg-white px-2 py-1 text-xs text-amber-900">{rawKey}</code>
        </div>
      )}
    </div>
  );
}
