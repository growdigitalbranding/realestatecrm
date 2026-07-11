import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function writeAuditLog(params: {
  builderId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await db.auditLog.create({
    data: {
      builderId: params.builderId,
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
    },
  });
}
