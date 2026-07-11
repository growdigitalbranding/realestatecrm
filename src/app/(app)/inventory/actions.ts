"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { writeAuditLog } from "@/lib/audit";
import type { UnitStatus } from "@/generated/prisma/client";

async function assertCanManageInventory() {
  const user = await requireUser();
  if (!can(user.role, "manageInventory")) throw new Error("Not authorized");
  return user;
}

export async function createTower(projectId: string, formData: FormData) {
  await assertCanManageInventory();
  await db.tower.create({ data: { projectId, name: String(formData.get("name")) } });
  revalidatePath("/inventory");
}

export async function createFloor(towerId: string, formData: FormData) {
  await assertCanManageInventory();
  await db.floor.create({
    data: {
      towerId,
      number: Number(formData.get("number")),
      name: (formData.get("name") as string) || undefined,
    },
  });
  revalidatePath("/inventory");
}

export async function createUnit(floorId: string, formData: FormData) {
  await assertCanManageInventory();
  await db.unit.create({
    data: {
      floorId,
      unitNumber: String(formData.get("unitNumber")),
      unitType: (formData.get("unitType") as string) || undefined,
      areaSqft: formData.get("areaSqft") ? Number(formData.get("areaSqft")) : undefined,
      facing: (formData.get("facing") as string) || undefined,
      price: formData.get("price") ? Number(formData.get("price")) : undefined,
      bookingAmount: formData.get("bookingAmount") ? Number(formData.get("bookingAmount")) : undefined,
    },
  });
  revalidatePath("/inventory");
}

export async function updateUnitStatus(unitId: string, formData: FormData) {
  const user = await assertCanManageInventory();
  const status = formData.get("status") as UnitStatus;
  await db.unit.update({ where: { id: unitId }, data: { status } });
  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: "unit.status_change",
    entityType: "Unit",
    entityId: unitId,
    metadata: { status },
  });
  revalidatePath("/inventory");
}
