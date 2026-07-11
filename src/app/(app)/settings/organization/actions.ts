"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";

export async function updateIpAllowlist(formData: FormData) {
  const user = await requireUser();
  if (!can(user.role, "manageUsers")) throw new Error("Not authorized");

  const raw = String(formData.get("ipAllowlist") ?? "");
  const ipAllowlist = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  await db.builder.update({
    where: { id: user.builderId },
    data: { ipAllowlist },
  });

  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: "organization.update_ip_allowlist",
    entityType: "Builder",
    entityId: user.builderId,
    metadata: { count: ipAllowlist.length },
  });

  revalidatePath("/settings/organization");
}
