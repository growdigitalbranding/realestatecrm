"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import type { MarketingPlatform } from "@/generated/prisma/client";

export async function createMarketingSource(formData: FormData) {
  const user = await requireUser();
  if (!can(user.role, "manageMarketing")) throw new Error("Not authorized");

  await db.marketingSource.create({
    data: {
      builderId: user.builderId,
      name: String(formData.get("name")),
      platform: formData.get("platform") as MarketingPlatform,
    },
  });

  revalidatePath("/marketing");
}

export async function createCampaign(formData: FormData) {
  const user = await requireUser();
  if (!can(user.role, "manageMarketing")) throw new Error("Not authorized");

  const marketingSourceId = String(formData.get("marketingSourceId"));
  const source = await db.marketingSource.findUniqueOrThrow({ where: { id: marketingSourceId } });

  await db.campaign.create({
    data: {
      projectId: String(formData.get("projectId")),
      marketingSourceId,
      platform: source.platform,
      name: String(formData.get("name")),
      spend: formData.get("spend") ? Number(formData.get("spend")) : undefined,
    },
  });

  revalidatePath("/marketing");
}
