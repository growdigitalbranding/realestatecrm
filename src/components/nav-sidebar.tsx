"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  FileSignature,
  Building2,
  Landmark,
  Megaphone,
  Workflow,
  BarChart3,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/permissions";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  MapPin,
  FileSignature,
  Building2,
  Landmark,
  Megaphone,
  Workflow,
  BarChart3,
  UserCog,
};

export function NavSidebar({ visibleHrefs }: { visibleHrefs: string[] }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => visibleHrefs.includes(item.href));

  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-slate-300 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
