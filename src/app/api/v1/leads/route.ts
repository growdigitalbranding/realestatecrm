import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import type { LeadStatus } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const apiKey = await authenticateApiRequest(req);
  if (!apiKey) return NextResponse.json({ error: "Invalid or missing x-api-key" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId") ?? undefined;
  const status = (searchParams.get("status") as LeadStatus | null) ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);

  const leads = await db.lead.findMany({
    where: { builderId: apiKey.builderId, projectId, status },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ data: leads });
}
