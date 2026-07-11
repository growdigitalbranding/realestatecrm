import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
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
