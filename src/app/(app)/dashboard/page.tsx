import Link from "next/link";
import { Users, PhoneCall, AlertCircle, MapPin, ReceiptText, IndianRupee } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, isFullAccess, scopedProjectIds } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_LABELS, LEAD_STATUS_BADGE } from "@/lib/lead-constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

export default async function DashboardPage() {
  const user = await requireUser();
  const allowedProjectIds = await scopedProjectIds(user);
  const fullAccess = isFullAccess(user.role) || user.isCompanyWide;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const leadWhere: Prisma.LeadWhereInput = { projectId: { in: allowedProjectIds } };
  if (!fullAccess) leadWhere.assignedToId = user.id;

  const [
    todayLeadsCount,
    overdueLeads,
    todayFollowUps,
    upcomingVisits,
    bookingsThisMonth,
    recentLeads,
  ] = await Promise.all([
    db.lead.count({ where: { ...leadWhere, createdAt: { gte: startOfToday } } }),
    db.lead.findMany({
      where: {
        ...leadWhere,
        nextFollowUpAt: { lt: startOfToday },
        status: { notIn: ["LOST", "BOOKED", "AGREEMENT", "REGISTERED", "POSSESSION"] },
      },
      include: { assignedTo: true, project: true },
      orderBy: { nextFollowUpAt: "asc" },
      take: 6,
    }),
    db.lead.findMany({
      where: {
        ...leadWhere,
        nextFollowUpAt: { gte: startOfToday, lt: endOfToday },
        status: { notIn: ["LOST", "BOOKED", "AGREEMENT", "REGISTERED", "POSSESSION"] },
      },
      include: { assignedTo: true, project: true },
      orderBy: { nextFollowUpAt: "asc" },
      take: 6,
    }),
    db.siteVisit.findMany({
      where: {
        projectId: { in: allowedProjectIds },
        ...(fullAccess ? {} : { executiveId: user.id }),
        scheduledAt: { gte: startOfToday },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      include: { lead: true, project: true },
      orderBy: { scheduledAt: "asc" },
      take: 6,
    }),
    db.booking.findMany({
      where: {
        projectId: { in: allowedProjectIds },
        createdAt: { gte: startOfMonth },
        status: { not: "CANCELLED" },
        ...(fullAccess ? {} : { salesExecutiveId: user.id }),
      },
    }),
    db.lead.findMany({
      where: leadWhere,
      include: { project: true, assignedTo: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const revenueThisMonth = bookingsThisMonth.reduce((sum, b) => sum + Number(b.totalPrice), 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Welcome back, {user.name?.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your pipeline today.</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <KpiCard icon={Users} label="Today's Leads" value={todayLeadsCount} />
        <KpiCard icon={AlertCircle} label="Overdue Follow-ups" value={overdueLeads.length} tone="destructive" />
        <KpiCard icon={PhoneCall} label="Due Today" value={todayFollowUps.length} />
        <KpiCard icon={MapPin} label="Upcoming Visits" value={upcomingVisits.length} />
        <KpiCard
          icon={fullAccess ? IndianRupee : ReceiptText}
          label={fullAccess ? "Revenue (Month)" : "Bookings (Month)"}
          value={fullAccess ? formatCurrency(revenueThisMonth) : bookingsThisMonth.length}
        />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Follow-ups Needing Attention</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {[...overdueLeads, ...todayFollowUps].map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                <div>
                  <div className="font-medium">{lead.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {lead.project.name} · {lead.assignedTo?.name ?? "Unassigned"}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={LEAD_STATUS_BADGE[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
                  <div
                    className={`mt-1 text-xs ${lead.nextFollowUpAt && lead.nextFollowUpAt < startOfToday ? "font-medium text-red-600" : "text-muted-foreground"}`}
                  >
                    {lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : "-"}
                  </div>
                </div>
              </Link>
            ))}
            {overdueLeads.length === 0 && todayFollowUps.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up. No follow-ups pending.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Site Visits</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {upcomingVisits.map((visit) => (
              <Link
                key={visit.id}
                href={`/leads/${visit.leadId}`}
                className="flex flex-col rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                <span className="font-medium">{visit.lead.name}</span>
                <span className="text-xs text-muted-foreground">{visit.project.name}</span>
                <span className="mt-1 text-xs font-medium text-primary">{formatDateTime(visit.scheduledAt)}</span>
              </Link>
            ))}
            {upcomingVisits.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No upcoming site visits.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {recentLeads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-muted"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{lead.name}</span>
                <span className="text-xs text-muted-foreground">{lead.project.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{formatDate(lead.createdAt)}</span>
                <Badge variant={LEAD_STATUS_BADGE[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
              </div>
            </Link>
          ))}
          {recentLeads.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No leads yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone?: "destructive";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <div className={`flex size-8 items-center justify-center rounded-md ${tone === "destructive" ? "bg-red-50 text-red-600" : "bg-secondary text-secondary-foreground"}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
