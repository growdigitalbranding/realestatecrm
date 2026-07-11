import { db } from "@/lib/db";
import { sendWhatsApp, sendSms, sendEmail } from "@/lib/providers/communication";
import type { AutomationTriggerType, Lead } from "@/generated/prisma/client";

type Action =
  | { type: "ASSIGN_TO"; executiveId: string }
  | { type: "NOTIFY_MANAGER" }
  | { type: "NOTIFY_USER"; userId: string }
  | { type: "SEND_WHATSAPP"; templateName?: string; message?: string }
  | { type: "SEND_SMS"; templateName?: string; message?: string }
  | { type: "SEND_EMAIL"; templateName?: string; message?: string }
  | Record<string, unknown>;

function evaluateCondition(conditions: unknown, facts: Record<string, unknown>): boolean {
  if (!conditions || typeof conditions !== "object" || Object.keys(conditions).length === 0) {
    return true;
  }
  const cond = conditions as Record<string, unknown>;

  if (typeof cond.field === "string" && typeof cond.operator === "string") {
    const factValue = facts[cond.field];
    if (factValue === undefined || factValue === null) return false;
    const target = cond.value as number | string;
    switch (cond.operator) {
      case "gt":
        return factValue > target;
      case "gte":
        return factValue >= target;
      case "lt":
        return factValue < target;
      case "lte":
        return factValue <= target;
      case "eq":
        return factValue === target;
      case "ne":
        return factValue !== target;
      default:
        return true;
    }
  }

  if ("noBookingWithinHours" in cond) {
    return facts.hasBooking === false;
  }

  return true;
}

async function resolveTemplateContent(templateName: string | undefined, lead: Lead, fallback: string) {
  if (!templateName) return fallback;
  const template = await db.messageTemplate.findFirst({ where: { name: templateName } });
  if (!template) return fallback;
  return template.content
    .replaceAll("{{name}}", lead.name)
    .replaceAll("{{project}}", "")
    .replaceAll("{{date}}", "")
    .replaceAll("{{time}}", "");
}

async function executeAction(action: Action, ctx: { lead: Lead; ruleName: string }) {
  const { lead, ruleName } = ctx;
  const type = (action as { type?: string }).type;

  if (type === "ASSIGN_TO") {
    const executiveId = (action as { executiveId: string }).executiveId;
    await db.lead.update({ where: { id: lead.id }, data: { assignedToId: executiveId } });
    await db.notification.create({
      data: {
        userId: executiveId,
        type: "LEAD_ASSIGNED",
        title: "Lead auto-assigned",
        message: `${lead.name} was assigned to you by automation rule "${ruleName}".`,
        link: `/leads/${lead.id}`,
      },
    });
    await db.leadActivity.create({
      data: { leadId: lead.id, type: "SYSTEM", content: `Auto-assigned via automation rule "${ruleName}"` },
    });
    return;
  }

  if (type === "NOTIFY_MANAGER") {
    const managers = await db.user.findMany({
      where: {
        builderId: lead.builderId,
        role: { in: ["SALES_MANAGER", "BUILDER_ADMIN"] },
        OR: [{ isCompanyWide: true }, { projectAccess: { some: { projectId: lead.projectId } } }],
      },
    });
    await db.notification.createMany({
      data: managers.map((m) => ({
        userId: m.id,
        type: "FOLLOW_UP_MISSED" as const,
        title: "Automation alert",
        message: `Rule "${ruleName}" triggered for lead ${lead.name}.`,
        link: `/leads/${lead.id}`,
      })),
    });
    return;
  }

  if (type === "NOTIFY_USER") {
    const userId = (action as { userId: string }).userId;
    await db.notification.create({
      data: {
        userId,
        type: "SYSTEM",
        title: "Automation alert",
        message: `Rule "${ruleName}" triggered for lead ${lead.name}.`,
        link: `/leads/${lead.id}`,
      },
    });
    return;
  }

  if (type === "SEND_WHATSAPP" || type === "SEND_SMS" || type === "SEND_EMAIL") {
    const a = action as { templateName?: string; message?: string };
    const content = await resolveTemplateContent(a.templateName, lead, a.message ?? `Hi ${lead.name}, following up on your enquiry.`);
    const channel = type === "SEND_WHATSAPP" ? "WHATSAPP" : type === "SEND_SMS" ? "SMS" : "EMAIL";
    const result =
      channel === "WHATSAPP"
        ? await sendWhatsApp(lead.mobile, content)
        : channel === "SMS"
          ? await sendSms(lead.mobile, content)
          : await sendEmail(lead.email ?? "", `Update on your enquiry`, content);

    await db.communicationLog.create({
      data: {
        leadId: lead.id,
        channel,
        direction: "OUTBOUND",
        content,
        status: result.status,
      },
    });
    await db.leadActivity.create({
      data: {
        leadId: lead.id,
        type: channel,
        content: `${content} (via automation rule "${ruleName}")`,
      },
    });
  }
}

export async function runAutomation(
  triggerType: AutomationTriggerType,
  lead: Lead,
  extraFacts: Record<string, unknown> = {},
) {
  const rules = await db.automationRule.findMany({
    where: {
      builderId: lead.builderId,
      triggerType,
      isActive: true,
      OR: [{ projectId: null }, { projectId: lead.projectId }],
    },
  });

  if (rules.length === 0) return;

  const facts: Record<string, unknown> = {
    budgetMin: lead.budgetMin ? Number(lead.budgetMin) : null,
    budgetMax: lead.budgetMax ? Number(lead.budgetMax) : null,
    city: lead.city,
    status: lead.status,
    source: lead.source,
    ...extraFacts,
  };

  for (const rule of rules) {
    if (!evaluateCondition(rule.conditions, facts)) continue;
    const actions = Array.isArray(rule.actions) ? (rule.actions as Action[]) : [];
    for (const action of actions) {
      await executeAction(action, { lead, ruleName: rule.name });
    }
  }
}
