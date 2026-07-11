"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { generateTotpSecret, verifyTotpCode } from "@/lib/totp";
import { signOut } from "@/auth";

export async function startTwoFactorEnrollment() {
  const user = await requireUser();
  const secret = generateTotpSecret();

  await db.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });

  revalidatePath("/settings/security");
}

export async function confirmTwoFactorEnrollment(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const user = await requireUser();
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });

  if (!record.twoFactorSecret) return "Start enrollment first.";

  const code = String(formData.get("code") ?? "");
  if (!verifyTotpCode(record.twoFactorSecret, code)) {
    return "That code didn't match. Check the time on your authenticator app and try again.";
  }

  await db.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: "user.2fa_enabled",
    entityType: "User",
    entityId: user.id,
  });

  revalidatePath("/settings/security");
}

export async function disableTwoFactor() {
  const user = await requireUser();
  await db.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: "user.2fa_disabled",
    entityType: "User",
    entityId: user.id,
  });
  revalidatePath("/settings/security");
}

export async function revokeAllSessions() {
  const user = await requireUser();
  await db.user.update({
    where: { id: user.id },
    data: { sessionVersion: { increment: 1 } },
  });
  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: "user.revoke_sessions",
    entityType: "User",
    entityId: user.id,
  });
  await signOut({ redirectTo: "/login" });
}
