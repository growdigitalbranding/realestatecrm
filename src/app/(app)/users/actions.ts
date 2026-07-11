"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import type { Role } from "@/generated/prisma/client";

export async function createTeamMember(formData: FormData) {
  const user = await requireUser();
  if (!can(user.role, "manageUsers")) throw new Error("Not authorized");

  const passwordHash = await bcrypt.hash(String(formData.get("password")), 10);
  const projectIds = formData.getAll("projectIds") as string[];

  const newUser = await db.user.create({
    data: {
      builderId: user.builderId,
      name: String(formData.get("name")),
      email: String(formData.get("email")).toLowerCase().trim(),
      passwordHash,
      role: formData.get("role") as Role,
      phone: (formData.get("phone") as string) || undefined,
      isCompanyWide: formData.get("isCompanyWide") === "on",
    },
  });

  if (projectIds.length > 0) {
    await db.userProjectAccess.createMany({
      data: projectIds.map((projectId) => ({ userId: newUser.id, projectId })),
    });
  }

  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: "user.create",
    entityType: "User",
    entityId: newUser.id,
    metadata: { role: newUser.role, email: newUser.email },
  });

  revalidatePath("/users");
}

export async function toggleUserActive(userId: string, formData: FormData) {
  const user = await requireUser();
  if (!can(user.role, "manageUsers")) throw new Error("Not authorized");

  const isActive = formData.get("isActive") === "true";
  await db.user.update({
    where: { id: userId },
    data: { isActive },
  });

  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: isActive ? "user.activate" : "user.deactivate",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/users");
}
