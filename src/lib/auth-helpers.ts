import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";

function matchesAllowlist(ip: string, allowlist: string[]) {
  return allowlist.some((entry) => {
    if (entry.endsWith("*")) return ip.startsWith(entry.slice(0, -1));
    return entry === ip;
  });
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const current = await db.user.findUnique({
    where: { id: session.user.id },
    select: { sessionVersion: true, isActive: true, builder: { select: { ipAllowlist: true } } },
  });

  if (!current || !current.isActive || current.sessionVersion !== session.user.sessionVersion) {
    redirect("/login?reason=session_revoked");
  }

  if (current.builder.ipAllowlist.length > 0) {
    const forwardedFor = (await headers()).get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim();
    if (!ip || !matchesAllowlist(ip, current.builder.ipAllowlist)) {
      redirect("/login?reason=ip_blocked");
    }
  }

  return session.user;
}

/** Full-access roles see every project in the company; others are scoped to assigned projects. */
export function isFullAccess(role: string) {
  return role === "SUPER_ADMIN" || role === "BUILDER_ADMIN" || role === "MARKETING_MANAGER";
}

export async function scopedProjectIds(user: {
  role: string;
  isCompanyWide: boolean;
  builderId: string;
  projectIds: string[];
}) {
  if (isFullAccess(user.role) || user.isCompanyWide) {
    const projects = await db.project.findMany({
      where: { builderId: user.builderId },
      select: { id: true },
    });
    return projects.map((p) => p.id);
  }
  return user.projectIds;
}
