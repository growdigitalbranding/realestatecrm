import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, isFullAccess, scopedProjectIds } from "@/lib/auth-helpers";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  LEAD_PIPELINE,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_BADGE,
  LEAD_SOURCE_LABELS,
} from "@/lib/lead-constants";
import { formatDate } from "@/lib/utils";
import type { LeadSourceType, LeadStatus, Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 25;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const allowedProjectIds = await scopedProjectIds(user);

  const where: Prisma.LeadWhereInput = {
    builderId: user.builderId,
    projectId: { in: allowedProjectIds },
  };

  if (!isFullAccess(user.role) && !user.isCompanyWide) {
    where.assignedToId = user.id;
  }

  if (params.status) where.status = params.status as LeadStatus;
  if (params.source) where.source = params.source as LeadSourceType;
  if (params.projectId) where.projectId = params.projectId;
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { mobile: { contains: params.q } },
      { email: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.filter === "overdue") {
    where.nextFollowUpAt = { lt: new Date() };
    where.status = { notIn: ["LOST", "BOOKED", "AGREEMENT", "REGISTERED", "POSSESSION"] };
  }

  const page = Math.max(1, Number(params.page) || 1);

  const [leads, total, projects] = await Promise.all([
    db.lead.findMany({
      where,
      include: { project: true, assignedTo: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.lead.count({ where }),
    db.project.findMany({ where: { id: { in: allowedProjectIds } } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { ...params, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) next.set(k, v);
    }
    return `/leads?${next.toString()}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">{total} leads matching filters</p>
        </div>
        <Link href="/leads/new">
          <Button>
            <Plus /> New Lead
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div className="flex min-w-56 flex-1 flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" defaultValue={params.q} placeholder="Name, mobile, email" className="pl-8" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Project</label>
            <Select name="projectId" defaultValue={params.projectId} className="w-44">
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
            <Select name="status" defaultValue={params.status} className="w-44">
              <option value="">All statuses</option>
              {[...LEAD_PIPELINE, "LOST"].map((s) => (
                <option key={s} value={s}>
                  {LEAD_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Source</label>
            <Select name="source" defaultValue={params.source} className="w-44">
              <option value="">All sources</option>
              {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
          {(params.q || params.status || params.source || params.projectId || params.filter) && (
            <Link href="/leads">
              <Button type="button" variant="ghost">
                Clear
              </Button>
            </Link>
          )}
        </form>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Next Follow-up</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Link href={`/leads/${lead.id}`} className="block">
                    <div className="font-medium text-foreground">{lead.name}</div>
                    <div className="text-xs text-muted-foreground">{lead.mobile}</div>
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{lead.project.name}</TableCell>
                <TableCell className="text-sm">{LEAD_SOURCE_LABELS[lead.source]}</TableCell>
                <TableCell>
                  <Badge variant={LEAD_STATUS_BADGE[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
                </TableCell>
                <TableCell className="text-sm">{lead.assignedTo?.name ?? "Unassigned"}</TableCell>
                <TableCell className="text-sm">
                  {lead.nextFollowUpAt ? (
                    <span className={lead.nextFollowUpAt < new Date() ? "font-medium text-red-600" : ""}>
                      {formatDate(lead.nextFollowUpAt)}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(lead.createdAt)}</TableCell>
              </TableRow>
            ))}
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No leads found for the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link href={buildHref({ page: String(Math.max(1, page - 1)) })}>
            <Button variant="outline" size="sm" disabled={page <= 1}>
              Previous
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Link href={buildHref({ page: String(Math.min(totalPages, page + 1)) })}>
            <Button variant="outline" size="sm" disabled={page >= totalPages}>
              Next
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
