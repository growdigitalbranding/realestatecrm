import { db } from "@/lib/db";
import { requireUser, isFullAccess, scopedProjectIds } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { LEAD_PIPELINE, LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from "@/lib/lead-constants";

export default async function ReportsPage() {
  const user = await requireUser();
  const allowedProjectIds = await scopedProjectIds(user);

  const leadWhere = isFullAccess(user.role) || user.isCompanyWide
    ? { projectId: { in: allowedProjectIds } }
    : { projectId: { in: allowedProjectIds }, assignedToId: user.id };

  const [leads, bookings, executives] = await Promise.all([
    db.lead.findMany({ where: leadWhere, select: { status: true, source: true, assignedToId: true, lostReason: true } }),
    db.booking.findMany({
      where: { projectId: { in: allowedProjectIds } },
      select: { totalPrice: true, status: true, salesExecutiveId: true },
    }),
    db.user.findMany({
      where: { builderId: user.builderId, role: { in: ["SALES_EXECUTIVE", "TELECALLER"] } },
    }),
  ]);

  const funnelCounts = LEAD_PIPELINE.reduce<Record<string, number>>((acc, status) => {
    acc[status] = leads.filter((l) => l.status === status).length;
    return acc;
  }, {});

  const sourceCounts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.source] = (acc[l.source] ?? 0) + 1;
    return acc;
  }, {});

  const lostReasons = leads
    .filter((l) => l.status === "LOST" && l.lostReason)
    .reduce<Record<string, number>>((acc, l) => {
      acc[l.lostReason!] = (acc[l.lostReason!] ?? 0) + 1;
      return acc;
    }, {});

  const revenue = bookings.filter((b) => b.status !== "CANCELLED").reduce((sum, b) => sum + Number(b.totalPrice), 0);
  const conversionRate = leads.length > 0 ? ((funnelCounts.BOOKED ?? 0) / leads.length) * 100 : 0;

  const executivePerformance = executives.map((exec) => {
    const execLeads = leads.filter((l) => l.assignedToId === exec.id);
    const execBookings = bookings.filter((b) => b.salesExecutiveId === exec.id && b.status !== "CANCELLED");
    return {
      name: exec.name,
      leads: execLeads.length,
      bookings: execBookings.length,
      revenue: execBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0),
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Conversion funnel, source performance and sales velocity</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xl font-semibold">{leads.length}</div>
          <div className="text-xs text-muted-foreground">Total Leads</div>
        </Card>
        <Card className="p-4">
          <div className="text-xl font-semibold">{conversionRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">Lead → Booking Conversion</div>
        </Card>
        <Card className="p-4">
          <div className="text-xl font-semibold">{formatCurrency(revenue)}</div>
          <div className="text-xs text-muted-foreground">Total Booking Value</div>
        </Card>
        <Card className="p-4">
          <div className="text-xl font-semibold">{funnelCounts.SITE_VISIT_DONE ?? 0}</div>
          <div className="text-xs text-muted-foreground">Site Visits Completed</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {LEAD_PIPELINE.map((status) => {
              const count = funnelCounts[status] ?? 0;
              const pct = leads.length > 0 ? (count / leads.length) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3 text-sm">
                  <span className="w-40 shrink-0 text-muted-foreground">{LEAD_STATUS_LABELS[status]}</span>
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right font-medium">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Source Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(sourceCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([source, count]) => (
                    <TableRow key={source}>
                      <TableCell className="text-sm">{LEAD_SOURCE_LABELS[source] ?? source}</TableCell>
                      <TableCell className="text-sm">{count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {leads.length > 0 ? ((count / leads.length) * 100).toFixed(0) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Executive Performance</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Executive</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executivePerformance.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="text-sm font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm">{row.leads}</TableCell>
                  <TableCell className="text-sm">{row.bookings}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(row.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lost Reasons</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {Object.entries(lostReasons)
              .sort((a, b) => b[1] - a[1])
              .map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{reason}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            {Object.keys(lostReasons).length === 0 && (
              <p className="text-sm text-muted-foreground">No lost leads recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
