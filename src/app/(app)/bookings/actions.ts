"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import type { BookingStatus } from "@/generated/prisma/client";

export async function createBooking(formData: FormData) {
  const user = await requireUser();
  if (!can(user.role, "markBooking")) throw new Error("Not authorized");

  const leadId = String(formData.get("leadId"));
  const unitId = String(formData.get("unitId"));
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  const unit = await db.unit.findUniqueOrThrow({ where: { id: unitId } });

  const totalPrice = Number(formData.get("totalPrice") || unit.price || 0);
  const bookingAmount = Number(formData.get("bookingAmount") || unit.bookingAmount || 0);

  const booking = await db.booking.create({
    data: {
      leadId,
      unitId,
      projectId: lead.projectId,
      salesExecutiveId: (formData.get("salesExecutiveId") as string) || lead.assignedToId || undefined,
      totalPrice,
      bookingAmount,
      commissionAmount: totalPrice * 0.015,
      status: "TOKEN",
    },
  });

  await db.unit.update({ where: { id: unitId }, data: { status: "BLOCKED" } });
  await db.lead.update({ where: { id: leadId }, data: { status: "BOOKING_TOKEN" } });
  await db.leadActivity.create({
    data: {
      leadId,
      userId: user.id,
      type: "SYSTEM",
      content: `Booking token created for unit ${unit.unitNumber}`,
    },
  });

  revalidatePath("/bookings");
  revalidatePath(`/leads/${leadId}`);
  redirect(`/bookings/${booking.id}`);
}

export async function updateBookingStatus(bookingId: string, formData: FormData) {
  const user = await requireUser();
  if (!can(user.role, "markBooking")) throw new Error("Not authorized");

  const booking = await db.booking.findUniqueOrThrow({ where: { id: bookingId } });
  const status = formData.get("status") as BookingStatus;

  await db.booking.update({ where: { id: bookingId }, data: { status } });

  if (status === "CONFIRMED") {
    await db.unit.update({ where: { id: booking.unitId }, data: { status: "BOOKED" } });
    await db.lead.update({ where: { id: booking.leadId }, data: { status: "BOOKED" } });
  } else if (status === "REGISTERED") {
    await db.unit.update({ where: { id: booking.unitId }, data: { status: "REGISTERED" } });
    await db.lead.update({ where: { id: booking.leadId }, data: { status: "REGISTERED" } });
  } else if (status === "CANCELLED") {
    await db.unit.update({ where: { id: booking.unitId }, data: { status: "AVAILABLE" } });
  }

  await db.leadActivity.create({
    data: {
      leadId: booking.leadId,
      userId: user.id,
      type: "SYSTEM",
      content: `Booking status changed to ${status}`,
    },
  });

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/bookings");
}

export async function addPayment(bookingId: string, formData: FormData) {
  const user = await requireUser();
  if (!can(user.role, "markBooking")) throw new Error("Not authorized");

  await db.payment.create({
    data: {
      bookingId,
      amount: Number(formData.get("amount")),
      mode: (formData.get("mode") as string) || undefined,
      reference: (formData.get("reference") as string) || undefined,
      status: "PAID",
      paidAt: new Date(),
    },
  });

  const booking = await db.booking.findUniqueOrThrow({ where: { id: bookingId } });
  await db.leadActivity.create({
    data: {
      leadId: booking.leadId,
      userId: user.id,
      type: "SYSTEM",
      content: `Payment of ₹${formData.get("amount")} recorded`,
    },
  });

  revalidatePath(`/bookings/${bookingId}`);
}
