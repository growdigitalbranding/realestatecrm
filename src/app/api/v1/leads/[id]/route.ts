import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const apiKey = await authenticateApiRequest(req);
  if (!apiKey) return NextResponse.json({ error: "Invalid or missing x-api-key" }, { status: 401 });

  const { id } = await ctx.params;
  const lead = await db.lead.findFirst({
    where: { id, builderId: apiKey.builderId },
    include: { activities: { orderBy: { createdAt: "desc" }, take: 20 }, bookings: true, siteVisits: true },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: lead });
}
