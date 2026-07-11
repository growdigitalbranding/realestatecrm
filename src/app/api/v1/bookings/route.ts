import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const apiKey = await authenticateApiRequest(req);
  if (!apiKey) return NextResponse.json({ error: "Invalid or missing x-api-key" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined;

  const bookings = await db.booking.findMany({
    where: { project: { builderId: apiKey.builderId }, projectId },
    include: { lead: true, unit: true, payments: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ data: bookings });
}

export async function POST(req: NextRequest) {
  const apiKey = await authenticateApiRequest(req);
  if (!apiKey) return NextResponse.json({ error: "Invalid or missing x-api-key" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.leadId || !body?.unitId) {
    return NextResponse.json({ error: "leadId and unitId are required" }, { status: 400 });
  }

  const lead = await db.lead.findFirst({ where: { id: body.leadId, builderId: apiKey.builderId } });
  if (!lead) return NextResponse.json({ error: "Unknown leadId" }, { status: 404 });

  const unit = await db.unit.findFirst({
    where: { id: body.unitId, floor: { tower: { project: { builderId: apiKey.builderId } } } },
  });
  if (!unit) return NextResponse.json({ error: "Unknown unitId" }, { status: 404 });

  const totalPrice = Number(body.totalPrice ?? unit.price ?? 0);
  const bookingAmount = Number(body.bookingAmount ?? unit.bookingAmount ?? 0);

  const booking = await db.booking.create({
    data: {
      leadId: lead.id,
      unitId: unit.id,
      projectId: lead.projectId,
      totalPrice,
      bookingAmount,
      commissionAmount: totalPrice * 0.015,
      status: "TOKEN",
    },
  });

  await db.unit.update({ where: { id: unit.id }, data: { status: "BLOCKED" } });
  await db.lead.update({ where: { id: lead.id }, data: { status: "BOOKING_TOKEN" } });

  return NextResponse.json({ data: booking }, { status: 201 });
}
