"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import { generateApiKey, hashApiKey } from "@/lib/api-keys";

export async function createApiKey(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const user = await requireUser();
  if (!can(user.role, "manageApiKeys")) throw new Error("Not authorized");

  const name = String(formData.get("name") || "API Key");
  const { raw, prefix } = generateApiKey();

  await db.apiKey.create({
    data: {
      builderId: user.builderId,
      name,
      keyHash: await hashApiKey(raw),
      keyPrefix: prefix,
    },
  });

  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: "api_key.create",
    entityType: "ApiKey",
    metadata: { name, prefix },
  });

  revalidatePath("/settings/api-keys");
  return raw;
}

export async function revokeApiKey(keyId: string) {
  const user = await requireUser();
  if (!can(user.role, "manageApiKeys")) throw new Error("Not authorized");

  await db.apiKey.update({ where: { id: keyId }, data: { isActive: false } });

  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: "api_key.revoke",
    entityType: "ApiKey",
    entityId: keyId,
  });

  revalidatePath("/settings/api-keys");
}
