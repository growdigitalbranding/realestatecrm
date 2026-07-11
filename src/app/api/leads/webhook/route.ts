import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { resolveAssignment } from "@/lib/assignment";
import { runAutomation } from "@/lib/automation";
import type { LeadSourceType, Prisma } from "@/generated/prisma/client";

const VALID_SOURCES = new Set([
  "WEBSITE_FORM", "WEBHOOK", "API", "JAVASCRIPT_FORM", "WORDPRESS_PLUGIN",
  "META_LEAD_ADS", "META_CAPI", "GOOGLE_LEAD_FORM", "GOOGLE_LANDING_PAGE",
  "GOOGLE_OFFLINE_CONVERSION", "WHATSAPP_CLICK_TO_CHAT", "WHATSAPP_CHATBOT",
  "WHATSAPP_MANUAL", "MAGICBRICKS", "ACRES99", "HOUSING_COM", "NOBROKER",
  "INDIAPROPERTY", "SQUAREYARDS", "CHANNEL_PARTNER", "WALK_IN", "REFERRAL",
  "CSV_IMPORT", "EXCEL_IMPORT", "OTHER",
]);

function inferSource(body: Record<string, unknown>): LeadSourceType {
  const explicit = String(body.source ?? "").toUpperCase();
  if (VALID_SOURCES.has(explicit)) return explicit as LeadSourceType;

  const utmSource = String(body.utm_source ?? body.utmSource ?? "").toLowerCase();
  if (utmSource.includes("facebook") || utmSource.includes("instagram") || utmSource.includes("meta")) {
    return "META_LEAD_ADS";
  }
  if (utmSource.includes("google")) return "GOOGLE_LEAD_FORM";
  if (body.gclid) return "GOOGLE_LEAD_FORM";
  if (body.fbclid) return "META_LEAD_ADS";
  return "WEBSITE_FORM";
}

export async function POST(req: NextRequest) {
  const apiKey = await authenticateApiRequest(req);
  if (!apiKey) {
    return NextResponse.json({ error: "Invalid or missing x-api-key" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const mobile = String(body.mobile ?? body.phone ?? "").trim();
  const name = String(body.name ?? body.full_name ?? "Unknown").trim();

  if (!mobile) {
    await db.webhookLog.create({
      data: { builderId: apiKey.builderId, source: "lead_webhook", payload: body as Prisma.InputJsonValue, status: "FAILED", error: "Missing mobile number" },
    });
    return NextResponse.json({ error: "mobile is required" }, { status: 400 });
  }

  const projectRef = String(body.project_id ?? body.projectId ?? body.project ?? body.project_slug ?? "");
  const project = await db.project.findFirst({
    where: {
      builderId: apiKey.builderId,
      OR: [{ id: projectRef }, { slug: projectRef }],
    },
  });

  if (!project) {
    await db.webhookLog.create({
      data: { builderId: apiKey.builderId, source: "lead_webhook", payload: body as Prisma.InputJsonValue, status: "FAILED", error: `Unknown project: ${projectRef}` },
    });
    return NextResponse.json({ error: `Unknown project: ${projectRef}` }, { status: 400 });
  }

  const source = inferSource(body);
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  const existing = await db.lead.findFirst({
    where: {
      projectId: project.id,
      mobile,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await db.leadActivity.create({
      data: {
        leadId: existing.id,
        type: "SYSTEM",
        content: `Duplicate submission received via ${source.replaceAll("_", " ").toLowerCase()} webhook`,
      },
    });
    await db.webhookLog.create({
      data: { builderId: apiKey.builderId, source: "lead_webhook", payload: body as Prisma.InputJsonValue, status: "DUPLICATE", leadId: existing.id },
    });
    return NextResponse.json({ success: true, leadId: existing.id, duplicate: true });
  }

  const budgetMax = body.budget_max ?? body.budgetMax ?? body.budget;

  const lead = await db.lead.create({
    data: {
      builderId: apiKey.builderId,
      projectId: project.id,
      name,
      mobile,
      email: (body.email as string) || undefined,
      city: (body.city as string) || undefined,
      state: (body.state as string) || undefined,
      budgetMin: body.budget_min ? Number(body.budget_min) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      source,
      campaign: (body.campaign as string) || undefined,
      adset: (body.adset as string) || undefined,
      ad: (body.ad as string) || undefined,
      utmSource: (body.utm_source as string) || (body.utmSource as string) || undefined,
      utmMedium: (body.utm_medium as string) || (body.utmMedium as string) || undefined,
      utmCampaign: (body.utm_campaign as string) || (body.utmCampaign as string) || undefined,
      utmTerm: (body.utm_term as string) || undefined,
      utmContent: (body.utm_content as string) || undefined,
      device: (body.device as string) || undefined,
      browser: (body.browser as string) || undefined,
      landingPage: (body.landing_page as string) || (body.landingPage as string) || undefined,
      gclid: (body.gclid as string) || undefined,
      fbclid: (body.fbclid as string) || undefined,
      ipAddress,
      status: "NEW",
    },
  });

  const assignedToId = await resolveAssignment(project.id, {
    budgetMax: lead.budgetMax ? Number(lead.budgetMax) : null,
    city: lead.city,
  });

  if (assignedToId) {
    await db.lead.update({ where: { id: lead.id }, data: { assignedToId } });
    await db.notification.create({
      data: {
        userId: assignedToId,
        type: "NEW_LEAD",
        title: "New lead assigned",
        message: `${lead.name} (${project.name}) has been assigned to you.`,
        link: `/leads/${lead.id}`,
      },
    });
  }

  await db.leadActivity.create({
    data: {
      leadId: lead.id,
      type: "SYSTEM",
      content: `Lead captured via ${source.replaceAll("_", " ").toLowerCase()} webhook`,
    },
  });

  await db.conversionEvent.create({
    data: {
      leadId: lead.id,
      eventType: "LEAD",
      platform: source.startsWith("META") ? "META" : source.startsWith("GOOGLE") ? "GOOGLE" : "OTHER",
      status: "PENDING",
      payload: { email: lead.email, phone: lead.mobile, fbclid: lead.fbclid, gclid: lead.gclid },
    },
  });

  await db.webhookLog.create({
    data: { builderId: apiKey.builderId, source: "lead_webhook", payload: body as Prisma.InputJsonValue, status: "PROCESSED", leadId: lead.id },
  });

  const finalLead = await db.lead.findUniqueOrThrow({ where: { id: lead.id } });
  await runAutomation("LEAD_CREATED", finalLead);

  return NextResponse.json({ success: true, leadId: lead.id, duplicate: false, assignedToId });
}
