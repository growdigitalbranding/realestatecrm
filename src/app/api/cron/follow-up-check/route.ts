import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { runAutomation } from "@/lib/automation";
import type { LeadStatus } from "@/generated/prisma/client";

/**
 * Time-based automation triggers (FOLLOW_UP_MISSED, NO_ACTIVITY) have no
 * natural request to hang off, so this route exists for an external
 * scheduler (Vercel Cron, GitHub Actions, cron(1), etc.) to call
 * periodically — e.g. every hour. Protect it with CRON_SECRET.
 */

const TERMINAL_STATUSES: LeadStatus[] = ["LOST", "BOOKED", "AGREEMENT", "REGISTERED", "POSSESSION"];
const NO_ACTIVITY_DAYS = 3;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const overdueLeads = await db.lead.findMany({
    where: {
      nextFollowUpAt: { lt: now },
      status: { notIn: TERMINAL_STATUSES },
    },
  });

  for (const lead of overdueLeads) {
    const hoursOverdue = lead.nextFollowUpAt
      ? Math.round((now.getTime() - lead.nextFollowUpAt.getTime()) / (60 * 60 * 1000))
      : 0;
    await runAutomation("FOLLOW_UP_MISSED", lead, { hoursOverdue });
  }

  const noActivityCutoff = new Date(now.getTime() - NO_ACTIVITY_DAYS * 24 * 60 * 60 * 1000);
  const staleLeads = await db.lead.findMany({
    where: {
      status: { notIn: TERMINAL_STATUSES },
      OR: [
        { lastContactedAt: { lt: noActivityCutoff } },
        { lastContactedAt: null, createdAt: { lt: noActivityCutoff } },
      ],
    },
  });

  for (const lead of staleLeads) {
    const reference = lead.lastContactedAt ?? lead.createdAt;
    const daysSinceLastActivity = Math.floor((now.getTime() - reference.getTime()) / (24 * 60 * 60 * 1000));
    await runAutomation("NO_ACTIVITY", lead, { daysSinceLastActivity });
  }

  return NextResponse.json({
    checkedAt: now.toISOString(),
    overdueLeadsProcessed: overdueLeads.length,
    staleLeadsProcessed: staleLeads.length,
  });
}
