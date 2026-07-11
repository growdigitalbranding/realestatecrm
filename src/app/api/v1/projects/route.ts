import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import type { ProjectStatus } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const apiKey = await authenticateApiRequest(req);
  if (!apiKey) return NextResponse.json({ error: "Invalid or missing x-api-key" }, { status: 401 });

  const projects = await db.project.findMany({
    where: { builderId: apiKey.builderId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: projects });
}

export async function POST(req: NextRequest) {
  const apiKey = await authenticateApiRequest(req);
  if (!apiKey) return NextResponse.json({ error: "Invalid or missing x-api-key" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const slug = String(body.name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const project = await db.project.create({
    data: {
      builderId: apiKey.builderId,
      name: body.name,
      slug,
      city: body.city,
      state: body.state,
      address: body.address,
      reraNumber: body.reraNumber,
      status: (body.status as ProjectStatus) || "UPCOMING",
      minBudget: body.minBudget ? Number(body.minBudget) : undefined,
      maxBudget: body.maxBudget ? Number(body.maxBudget) : undefined,
    },
  });

  return NextResponse.json({ data: project }, { status: 201 });
}
