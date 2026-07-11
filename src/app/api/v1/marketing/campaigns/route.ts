import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import type { MarketingPlatform } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const apiKey = await authenticateApiRequest(req);
  if (!apiKey) return NextResponse.json({ error: "Invalid or missing x-api-key" }, { status: 401 });

  const campaigns = await db.campaign.findMany({
    where: { project: { builderId: apiKey.builderId } },
    include: { project: true, marketingSource: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ data: campaigns });
}

export async function POST(req: NextRequest) {
  const apiKey = await authenticateApiRequest(req);
  if (!apiKey) return NextResponse.json({ error: "Invalid or missing x-api-key" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.projectId || !body?.name || !body?.platform) {
    return NextResponse.json({ error: "projectId, name and platform are required" }, { status: 400 });
  }

  const project = await db.project.findFirst({ where: { id: body.projectId, builderId: apiKey.builderId } });
  if (!project) return NextResponse.json({ error: "Unknown projectId" }, { status: 404 });

  const campaign = await db.campaign.create({
    data: {
      projectId: project.id,
      name: body.name,
      platform: body.platform as MarketingPlatform,
      externalId: body.externalId,
      spend: body.spend ? Number(body.spend) : undefined,
      marketingSourceId: body.marketingSourceId,
    },
  });

  return NextResponse.json({ data: campaign }, { status: 201 });
}
