import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyApiKey } from "@/lib/api-keys";
import type { ApiKey } from "@/generated/prisma/client";

export async function authenticateApiRequest(req: NextRequest): Promise<ApiKey | null> {
  const rawKey = req.headers.get("x-api-key");
  if (!rawKey) return null;

  const prefix = rawKey.slice(0, 10);
  const candidates = await db.apiKey.findMany({ where: { keyPrefix: prefix, isActive: true } });

  for (const candidate of candidates) {
    if (await verifyApiKey(rawKey, candidate.keyHash)) {
      await db.apiKey.update({ where: { id: candidate.id }, data: { lastUsedAt: new Date() } });
      return candidate;
    }
  }
  return null;
}
