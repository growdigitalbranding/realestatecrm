"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import type { ProjectStatus } from "@/generated/prisma/client";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProject(formData: FormData) {
  const user = await requireUser();
  if (!can(user.role, "manageProjects")) throw new Error("Not authorized");

  const name = String(formData.get("name"));
  const project = await db.project.create({
    data: {
      builderId: user.builderId,
      name,
      slug: slugify(name),
      city: (formData.get("city") as string) || undefined,
      state: (formData.get("state") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      reraNumber: (formData.get("reraNumber") as string) || undefined,
      status: (formData.get("status") as ProjectStatus) || "UPCOMING",
      minBudget: formData.get("minBudget") ? Number(formData.get("minBudget")) : undefined,
      maxBudget: formData.get("maxBudget") ? Number(formData.get("maxBudget")) : undefined,
    },
  });

  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: "project.create",
    entityType: "Project",
    entityId: project.id,
    metadata: { name },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function grantProjectAccess(projectId: string, formData: FormData) {
  const user = await requireUser();
  if (!can(user.role, "manageProjects")) throw new Error("Not authorized");

  const userId = String(formData.get("userId"));
  await db.userProjectAccess.upsert({
    where: { userId_projectId: { userId, projectId } },
    create: { userId, projectId },
    update: {},
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function revokeProjectAccess(projectId: string, userId: string) {
  const user = await requireUser();
  if (!can(user.role, "manageProjects")) throw new Error("Not authorized");

  await db.userProjectAccess.deleteMany({ where: { projectId, userId } });
  revalidatePath(`/projects/${projectId}`);
}
