import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import type { UnitStatus } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const apiKey = await authenticateApiRequest(req);
  if (!apiKey) return NextResponse.json({ error: "Invalid or missing x-api-key" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId") ?? undefined;
  const status = searchParams.get("status") as UnitStatus | undefined;

  const units = await db.unit.findMany({
    where: {
      floor: { tower: { project: { builderId: apiKey.builderId, id: projectId } } },
      status: status ?? undefined,
    },
    include: { floor: { include: { tower: true } } },
    take: 500,
  });

  return NextResponse.json({ data: units });
}

export async function POST(req: NextRequest) {
  const apiKey = await authenticateApiRequest(req);
  if (!apiKey) return NextResponse.json({ error: "Invalid or missing x-api-key" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.floorId || !body?.unitNumber) {
    return NextResponse.json({ error: "floorId and unitNumber are required" }, { status: 400 });
  }

  const floor = await db.floor.findFirst({
    where: { id: body.floorId, tower: { project: { builderId: apiKey.builderId } } },
  });
  if (!floor) return NextResponse.json({ error: "Unknown floorId" }, { status: 404 });

  const unit = await db.unit.create({
    data: {
      floorId: body.floorId,
      unitNumber: body.unitNumber,
      unitType: body.unitType,
      areaSqft: body.areaSqft ? Number(body.areaSqft) : undefined,
      facing: body.facing,
      price: body.price ? Number(body.price) : undefined,
      bookingAmount: body.bookingAmount ? Number(body.bookingAmount) : undefined,
    },
  });

  return NextResponse.json({ data: unit }, { status: 201 });
}
