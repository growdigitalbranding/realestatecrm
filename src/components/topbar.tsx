import { LogOut } from "lucide-react";
import { logout } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/permissions";
import { initials } from "@/lib/utils";
import type { Role } from "@/generated/prisma/client";

export function Topbar({
  name,
  role,
  builderName,
}: {
  name: string;
  role: Role;
  builderName: string;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="text-sm font-medium text-muted-foreground">{builderName}</div>
      <div className="flex items-center gap-3">
        <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials(name)}
          </div>
          <span className="text-sm font-medium">{name}</span>
        </div>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="icon" title="Sign out">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
