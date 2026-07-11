"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, scopedProjectIds } from "@/lib/auth-helpers";
import { resolveAssignment } from "@/lib/assignment";
import { runAutomation } from "@/lib/automation";
import { writeAuditLog } from "@/lib/audit";
import { sendMetaConversionEvent, sendGoogleConversionEvent } from "@/lib/providers/conversion";
import { sendWhatsApp, sendSms, sendEmail } from "@/lib/providers/communication";
import type { LeadSourceType, LeadStatus, ActivityType } from "@/generated/prisma/client";

async function assertProjectAccess(projectId: string) {
  const user = await requireUser();
  const allowed = await scopedProjectIds(user);
  if (!allowed.includes(projectId)) {
    throw new Error("You do not have access to this project.");
  }
  return user;
}

export async function createLead(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId"));
  await assertProjectAccess(projectId);

  const budgetMin = formData.get("budgetMin");
  const budgetMax = formData.get("budgetMax");

  const lead = await db.lead.create({
    data: {
      builderId: user.builderId,
      projectId,
      name: String(formData.get("name")),
      mobile: String(formData.get("mobile")),
      email: (formData.get("email") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      state: (formData.get("state") as string) || undefined,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      source: (formData.get("source") as LeadSourceType) || "WALK_IN",
      sourceDetail: (formData.get("sourceDetail") as string) || undefined,
      createdById: user.id,
      status: "NEW",
    },
  });

  const assignedToId =
    (formData.get("assignedToId") as string) ||
    (await resolveAssignment(projectId, {
      budgetMax: lead.budgetMax ? Number(lead.budgetMax) : null,
      city: lead.city,
    }));

  if (assignedToId) {
    await db.lead.update({ where: { id: lead.id }, data: { assignedToId } });
    await db.notification.create({
      data: {
        userId: assignedToId,
        type: "NEW_LEAD",
        title: "New lead assigned",
        message: `${lead.name} has been assigned to you.`,
        link: `/leads/${lead.id}`,
      },
    });
  }

  await db.leadActivity.create({
    data: {
      leadId: lead.id,
      userId: user.id,
      type: "SYSTEM",
      content: `Lead created manually by ${user.name}`,
    },
  });

  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: "lead.create",
    entityType: "Lead",
    entityId: lead.id,
    metadata: { source: lead.source, projectId },
  });

  const finalLead = await db.lead.findUniqueOrThrow({ where: { id: lead.id } });
  await runAutomation("LEAD_CREATED", finalLead);

  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function updateLeadStatus(leadId: string, formData: FormData) {
  const user = await requireUser();
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  await assertProjectAccess(lead.projectId);

  const status = formData.get("status") as LeadStatus;
  const lostReason = (formData.get("lostReason") as string) || undefined;

  const updated = await db.lead.update({
    where: { id: leadId },
    data: {
      status,
      lostReason: status === "LOST" ? lostReason : null,
    },
  });

  await db.leadActivity.create({
    data: {
      leadId,
      userId: user.id,
      type: "STATUS_CHANGE",
      content: `Status changed from ${lead.status} to ${status}${lostReason ? ` (${lostReason})` : ""}`,
    },
  });

  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: "lead.status_change",
    entityType: "Lead",
    entityId: leadId,
    metadata: { from: lead.status, to: status, lostReason },
  });

  await runAutomation("STATUS_CHANGED", updated, { previousStatus: lead.status });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

export async function assignLead(leadId: string, formData: FormData) {
  const user = await requireUser();
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  await assertProjectAccess(lead.projectId);

  const assignedToId = String(formData.get("assignedToId"));
  const assignee = await db.user.findUniqueOrThrow({ where: { id: assignedToId } });

  await db.lead.update({ where: { id: leadId }, data: { assignedToId } });
  await db.leadActivity.create({
    data: {
      leadId,
      userId: user.id,
      type: "ASSIGNMENT",
      content: `Reassigned to ${assignee.name} by ${user.name}`,
    },
  });
  await db.notification.create({
    data: {
      userId: assignedToId,
      type: "LEAD_ASSIGNED",
      title: "Lead assigned to you",
      message: `${lead.name} has been assigned to you.`,
      link: `/leads/${leadId}`,
    },
  });

  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: "lead.reassign",
    entityType: "Lead",
    entityId: leadId,
    metadata: { assignedToId },
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

export async function addActivity(leadId: string, formData: FormData) {
  const user = await requireUser();
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  await assertProjectAccess(lead.projectId);

  const type = formData.get("type") as ActivityType;
  const content = (formData.get("content") as string) || undefined;
  const nextFollowUpRaw = formData.get("nextFollowUpAt") as string | null;
  const nextFollowUpAt = nextFollowUpRaw ? new Date(nextFollowUpRaw) : undefined;

  await db.leadActivity.create({
    data: { leadId, userId: user.id, type, content, nextFollowUpAt },
  });

  await db.lead.update({
    where: { id: leadId },
    data: {
      lastContactedAt: new Date(),
      nextFollowUpAt: nextFollowUpAt ?? lead.nextFollowUpAt,
    },
  });

  if (nextFollowUpAt) {
    await db.task.create({
      data: {
        leadId,
        assignedToId: lead.assignedToId ?? user.id,
        title: `Follow up with ${lead.name}`,
        dueAt: nextFollowUpAt,
        status: "PENDING",
      },
    });
  }

  if (type === "WHATSAPP" || type === "SMS" || type === "EMAIL") {
    const messageBody = content ?? "";
    const result =
      type === "WHATSAPP"
        ? await sendWhatsApp(lead.mobile, messageBody)
        : type === "SMS"
          ? await sendSms(lead.mobile, messageBody)
          : await sendEmail(lead.email ?? "", "Update on your enquiry", messageBody);

    await db.communicationLog.create({
      data: {
        leadId,
        userId: user.id,
        channel: type,
        direction: "OUTBOUND",
        content,
        status: result.status,
      },
    });
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function scheduleSiteVisit(leadId: string, formData: FormData) {
  const user = await requireUser();
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  await assertProjectAccess(lead.projectId);

  const scheduledAt = new Date(String(formData.get("scheduledAt")));
  const executiveId = (formData.get("executiveId") as string) || lead.assignedToId || user.id;

  await db.siteVisit.create({
    data: {
      leadId,
      projectId: lead.projectId,
      executiveId,
      scheduledAt,
      familyMembers: formData.get("familyMembers") ? Number(formData.get("familyMembers")) : undefined,
      notes: (formData.get("notes") as string) || undefined,
    },
  });

  if (lead.status === "NEW" || lead.status === "CONTACTED" || lead.status === "INTERESTED") {
    await db.lead.update({ where: { id: leadId }, data: { status: "SITE_VISIT_SCHEDULED" } });
  }

  await db.leadActivity.create({
    data: {
      leadId,
      userId: user.id,
      type: "SITE_VISIT",
      content: `Site visit scheduled for ${scheduledAt.toLocaleString("en-IN")}`,
      nextFollowUpAt: scheduledAt,
    },
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/site-visits");
}

export async function completeSiteVisit(siteVisitId: string, formData: FormData) {
  const user = await requireUser();
  const visit = await db.siteVisit.findUniqueOrThrow({ where: { id: siteVisitId } });
  await assertProjectAccess(visit.projectId);

  const feedback = (formData.get("feedback") as string) || undefined;

  await db.siteVisit.update({
    where: { id: siteVisitId },
    data: { status: "COMPLETED", feedback, checkOutAt: new Date() },
  });

  const updatedLead = await db.lead.update({
    where: { id: visit.leadId },
    data: { status: "SITE_VISIT_DONE" },
  });

  await db.leadActivity.create({
    data: {
      leadId: visit.leadId,
      userId: user.id,
      type: "SITE_VISIT",
      content: `Site visit completed. ${feedback ?? ""}`.trim(),
    },
  });

  const hasBooking = (await db.booking.count({ where: { leadId: visit.leadId } })) > 0;
  await runAutomation("SITE_VISIT_COMPLETED", updatedLead, { hasBooking });

  revalidatePath(`/leads/${visit.leadId}`);
  revalidatePath("/site-visits");
}

const CONVERSION_EVENT_NAMES: Record<string, string> = {
  LEAD: "Lead",
  QUALIFIED_LEAD: "SubmitApplication",
  SITE_VISIT: "Schedule",
  BOOKING: "AddToCart",
  PURCHASE: "Purchase",
};

export async function sendConversionEvent(leadId: string, formData: FormData) {
  const user = await requireUser();
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId } });
  await assertProjectAccess(lead.projectId);

  const eventType = formData.get("eventType") as "LEAD" | "QUALIFIED_LEAD" | "SITE_VISIT" | "BOOKING" | "PURCHASE";
  const platform = lead.source.startsWith("META") ? "META" : lead.source.startsWith("GOOGLE") ? "GOOGLE" : "META";

  const marketingSource = await db.marketingSource.findFirst({
    where: { builderId: user.builderId, platform, isActive: true },
  });

  const result =
    platform === "META"
      ? await sendMetaConversionEvent({
          config: marketingSource?.config as { pixelId?: string; accessToken?: string } | null,
          eventName: CONVERSION_EVENT_NAMES[eventType] ?? eventType,
          email: lead.email,
          phone: lead.mobile,
          fbclid: lead.fbclid,
        })
      : await sendGoogleConversionEvent({
          config: marketingSource?.config as Record<string, string> | null,
          gclid: lead.gclid,
          email: lead.email,
          phone: lead.mobile,
        });

  await db.conversionEvent.create({
    data: {
      leadId,
      eventType,
      platform,
      status: result.status,
      sentAt: result.status === "SENT" ? new Date() : undefined,
      payload: { email: lead.email, phone: lead.mobile, fbclid: lead.fbclid, gclid: lead.gclid },
      response: (result.status === "SENT" ? result.response : { error: result.error }) as object,
    },
  });

  await db.leadActivity.create({
    data: {
      leadId,
      userId: user.id,
      type: "SYSTEM",
      content: `${eventType.replaceAll("_", " ")} conversion event ${result.status === "SENT" ? "sent to" : "failed for"} ${platform}`,
    },
  });

  revalidatePath(`/leads/${leadId}`);
}
