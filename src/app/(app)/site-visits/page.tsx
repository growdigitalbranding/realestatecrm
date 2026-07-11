import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser, isFullAccess, scopedProjectIds } from "@/lib/auth-helpers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import type { Prisma, SiteVisitStatus } from "@/generated/prisma/client";

const STATUS_BADGE: Record<string, "outline" | "success" | "destructive" | "muted"> = {
  SCHEDULED: "outline",
  CONFIRMED: "outline",
  COMPLETED: "success",
  CANCELLED: "destructive",
  NO_SHOW: "muted",
};

export default async function SiteVisitsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const allowedProjectIds = await scopedProjectIds(user);

  const where: Prisma.SiteVisitWhereInput = { projectId: { in: allowedProjectIds } };
  if (!isFullAccess(user.role) && !user.isCompanyWide) {
    where.executiveId = user.id;
  }
  if (params.status) where.status = params.status as SiteVisitStatus;
  if (params.projectId) where.projectId = params.projectId;

  const [visits, projects] = await Promise.all([
    db.siteVisit.findMany({
      where,
      include: { lead: true, project: true, executive: true },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    }),
    db.project.findMany({ where: { id: { in: allowedProjectIds } } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Site Visits</h1>
        <p className="text-sm text-muted-foreground">{visits.length} visits</p>
      </div>

      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Project</label>
            <Select name="projectId" defaultValue={params.projectId} className="w-48">
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select name="status" defaultValue={params.status} className="w-48">
              <option value="">All statuses</option>
              {["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Executive</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.map((visit) => (
              <TableRow key={visit.id}>
                <TableCell>
                  <Link href={`/leads/${visit.leadId}`} className="font-medium hover:underline">
                    {visit.lead.name}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{visit.project.name}</TableCell>
                <TableCell className="text-sm">{formatDateTime(visit.scheduledAt)}</TableCell>
                <TableCell className="text-sm">{visit.executive?.name ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[visit.status]}>{visit.status.replaceAll("_", " ")}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {visits.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No site visits found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
