import { Building2 } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { can, NAV_ITEMS } from "@/lib/permissions";
import { NavSidebar } from "@/components/nav-sidebar";
import { Topbar } from "@/components/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const visibleHrefs = NAV_ITEMS.filter(
    (item) => !item.capability || can(user.role, item.capability),
  ).map((item) => item.href);

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-60 shrink-0 flex-col bg-slate-900 py-4">
        <div className="mb-6 flex items-center gap-2 px-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4.5" />
          </div>
          <span className="text-sm font-semibold text-white">RealtyFlow</span>
        </div>
        <NavSidebar visibleHrefs={visibleHrefs} />
      </aside>
      <div className="flex flex-1 flex-col">
        <Topbar userId={user.id} name={user.name ?? ""} role={user.role} builderName={user.builderName} />
        <main className="flex-1 bg-background p-6">{children}</main>
      </div>
    </div>
  );
}
