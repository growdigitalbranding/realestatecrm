"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import type { AutomationTriggerType } from "@/generated/prisma/client";

function parseJsonField(raw: FormDataEntryValue | null, fallback: unknown) {
  if (!raw) return fallback;
  try {
    return JSON.parse(String(raw));
  } catch {
    return fallback;
  }
}

export async function createAutomationRule(formData: FormData) {
  const user = await requireUser();
  if (!can(user.role, "manageAutomation")) throw new Error("Not authorized");

  await db.automationRule.create({
    data: {
      builderId: user.builderId,
      projectId: (formData.get("projectId") as string) || undefined,
      name: String(formData.get("name")),
      triggerType: formData.get("triggerType") as AutomationTriggerType,
      conditions: parseJsonField(formData.get("conditions"), {}),
      actions: parseJsonField(formData.get("actions"), []),
    },
  });

  revalidatePath("/automation");
}

export async function toggleAutomationRule(ruleId: string, formData: FormData) {
  const user = await requireUser();
  if (!can(user.role, "manageAutomation")) throw new Error("Not authorized");

  await db.automationRule.update({
    where: { id: ruleId },
    data: { isActive: formData.get("isActive") === "true" },
  });

  revalidatePath("/automation");
}
