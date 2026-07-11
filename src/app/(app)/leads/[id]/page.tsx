import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, MessageCircle, Mail, MapPin, Send, ReceiptText } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, scopedProjectIds } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_BADGE,
  LEAD_SOURCE_LABELS,
  ACTIVITY_TYPE_LABELS,
} from "@/lib/lead-constants";
import { formatCurrency, formatDate, formatDateTime, initials } from "@/lib/utils";
import {
  updateLeadStatus,
  assignLead,
  addActivity,
  scheduleSiteVisit,
  completeSiteVisit,
  sendConversionEvent,
} from "../actions";
import { StatusChangeForm } from "./status-form";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const allowedProjectIds = await scopedProjectIds(user);

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      project: true,
      assignedTo: true,
      activities: { include: { user: true }, orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { dueAt: "asc" } },
      siteVisits: { orderBy: { scheduledAt: "desc" } },
      bookings: { include: { unit: true } },
      conversionEvents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead || !allowedProjectIds.includes(lead.projectId)) {
    notFound();
  }

  const executives = await db.user.findMany({
    where: { builderId: user.builderId, role: { in: ["SALES_EXECUTIVE", "TELECALLER"] }, isActive: true },
    orderBy: { name: "asc" },
  });

  const boundUpdateStatus = updateLeadStatus.bind(null, lead.id);
  const boundAssign = assignLead.bind(null, lead.id);
  const boundAddActivity = addActivity.bind(null, lead.id);
  const boundScheduleVisit = scheduleSiteVisit.bind(null, lead.id);
  const boundSendConversion = sendConversionEvent.bind(null, lead.id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
            {initials(lead.name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{lead.name}</h1>
              <Badge variant={LEAD_STATUS_BADGE[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {lead.project.name} · {LEAD_SOURCE_LABELS[lead.source]} · Created {formatDate(lead.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`tel:${lead.mobile}`}>
            <Button variant="outline" size="sm">
              <Phone /> Call
            </Button>
          </a>
          <a href={`https://wa.me/${lead.mobile.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <MessageCircle /> WhatsApp
            </Button>
          </a>
          {lead.email && (
            <a href={`mailto:${lead.email}`}>
              <Button variant="outline" size="sm">
                <Mail /> Email
              </Button>
            </a>
          )}
          {lead.bookings.length === 0 && can(user.role, "markBooking") && (
            <Link href={`/bookings/new?leadId=${lead.id}`}>
              <Button size="sm">
                <ReceiptText /> Mark Booking
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <StatusChangeForm currentStatus={lead.status} action={boundUpdateStatus} />
          <form action={boundAssign} className="flex items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Assigned to</label>
              <Select name="assignedToId" defaultValue={lead.assignedToId ?? ""} className="w-48">
                <option value="" disabled>
                  Unassigned
                </option>
                {executives.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="secondary">
              Reassign
            </Button>
          </form>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Log Activity / Follow-up</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={boundAddActivity} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Type</Label>
                    <Select name="type" defaultValue="CALL">
                      {["CALL", "WHATSAPP", "EMAIL", "SMS", "NOTE", "MEETING"].map((t) => (
                        <option key={t} value={t}>
                          {ACTIVITY_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Next follow-up</Label>
                    <Input type="datetime-local" name="nextFollowUpAt" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Notes</Label>
                  <Textarea name="content" placeholder="What was discussed?" rows={3} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit">
                    <Send /> Log
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-4">
                {lead.activities.map((activity) => (
                  <li key={activity.id} className="flex gap-3 border-l-2 border-border pl-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{ACTIVITY_TYPE_LABELS[activity.type]}</span>
                        <span className="text-xs text-muted-foreground">
                          {activity.user?.name ?? "System"} · {formatDateTime(activity.createdAt)}
                        </span>
                      </div>
                      {activity.content && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{activity.content}</p>
                      )}
                    </div>
                  </li>
                ))}
                {lead.activities.length === 0 && (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                )}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Row label="Mobile" value={lead.mobile} />
              <Row label="Email" value={lead.email ?? "-"} />
              <Row label="City" value={lead.city ?? "-"} />
              <Row
                label="Budget"
                value={`${formatCurrency(lead.budgetMin ? Number(lead.budgetMin) : null)} - ${formatCurrency(
                  lead.budgetMax ? Number(lead.budgetMax) : null,
                )}`}
              />
              <Row label="Next follow-up" value={lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Marketing Attribution</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Row label="Campaign" value={lead.campaign ?? "-"} />
              <Row label="Ad Set" value={lead.adset ?? "-"} />
              <Row label="Ad" value={lead.ad ?? "-"} />
              <Row label="UTM Source" value={lead.utmSource ?? "-"} />
              <Row label="UTM Medium" value={lead.utmMedium ?? "-"} />
              <Row label="Device" value={lead.device ?? "-"} />
              <Row label="GCLID" value={lead.gclid ?? "-"} />
              <Row label="FBCLID" value={lead.fbclid ?? "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion Events</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <form action={boundSendConversion} className="flex gap-2">
                <Select name="eventType" defaultValue="QUALIFIED_LEAD" className="flex-1">
                  <option value="LEAD">Lead</option>
                  <option value="QUALIFIED_LEAD">Qualified Lead</option>
                  <option value="SITE_VISIT">Site Visit</option>
                  <option value="BOOKING">Booking</option>
                  <option value="PURCHASE">Purchase</option>
                </Select>
                <Button type="submit" variant="secondary" size="sm">
                  Send
                </Button>
              </form>
              <div className="flex flex-col gap-1.5">
                {lead.conversionEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center justify-between text-xs">
                    <span>
                      {ev.eventType.replaceAll("_", " ")} · {ev.platform}
                    </span>
                    <Badge variant={ev.status === "SENT" ? "success" : "muted"}>{ev.status}</Badge>
                  </div>
                ))}
                {lead.conversionEvents.length === 0 && (
                  <p className="text-xs text-muted-foreground">No events sent yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Site Visits</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <form action={boundScheduleVisit} className="flex flex-col gap-2">
                <Input type="datetime-local" name="scheduledAt" required />
                <Button type="submit" variant="secondary" size="sm">
                  <MapPin /> Schedule Site Visit
                </Button>
              </form>
              <div className="flex flex-col gap-2">
                {lead.siteVisits.map((visit) => (
                  <div key={visit.id} className="rounded-md border border-border p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{formatDateTime(visit.scheduledAt)}</span>
                      <Badge variant={visit.status === "COMPLETED" ? "success" : "outline"}>{visit.status}</Badge>
                    </div>
                    {visit.feedback && <p className="mt-1 text-muted-foreground">{visit.feedback}</p>}
                    {visit.status !== "COMPLETED" && visit.status !== "CANCELLED" && (
                      <form action={completeSiteVisit.bind(null, visit.id)} className="mt-2 flex gap-1">
                        <Input name="feedback" placeholder="Feedback" className="h-7 text-xs" />
                        <Button type="submit" size="sm" variant="outline" className="h-7">
                          Mark Done
                        </Button>
                      </form>
                    )}
                  </div>
                ))}
                {lead.siteVisits.length === 0 && (
                  <p className="text-xs text-muted-foreground">No site visits scheduled.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {lead.bookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bookings</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {lead.bookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.id}`}
                    className="block rounded-md border border-border p-2 text-xs hover:bg-muted"
                  >
                    <div className="font-medium">Unit {booking.unit.unitNumber}</div>
                    <div className="text-muted-foreground">
                      {formatCurrency(Number(booking.totalPrice))} · {booking.status}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
