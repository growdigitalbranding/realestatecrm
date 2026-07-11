import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, scopedProjectIds } from "@/lib/auth-helpers";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { grantProjectAccess, revokeProjectAccess } from "../actions";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const allowedProjectIds = await scopedProjectIds(user);
  if (!allowedProjectIds.includes(id)) notFound();

  const project = await db.project.findUnique({
    where: { id },
    include: {
      towers: { include: { floors: { include: { units: true } } } },
      userAccess: { include: { user: true } },
      _count: { select: { leads: true, bookings: true } },
    },
  });
  if (!project) notFound();

  const units = project.towers.flatMap((t) => t.floors.flatMap((f) => f.units));
  const statusCounts = units.reduce<Record<string, number>>((acc, u) => {
    acc[u.status] = (acc[u.status] ?? 0) + 1;
    return acc;
  }, {});

  const teamUsers = await db.user.findMany({
    where: { builderId: user.builderId, id: { notIn: project.userAccess.map((a) => a.userId) } },
    orderBy: { name: "asc" },
  });

  const canManage = can(user.role, "manageProjects");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {project.address ?? `${project.city}, ${project.state}`}
          </p>
        </div>
        <Link href={`/inventory?projectId=${project.id}`}>
          <Button variant="outline">
            <Building2 /> View Inventory
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={project._count.leads} />
        <StatCard label="Total Units" value={units.length} />
        <StatCard label="Available Units" value={statusCounts.AVAILABLE ?? 0} />
        <StatCard label="Bookings" value={project._count.bookings} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Inventory Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {["AVAILABLE", "BLOCKED", "BOOKED", "REGISTERED", "SOLD"].map((status) => (
                <div key={status} className="rounded-md border border-border p-3 text-center">
                  <div className="text-xl font-semibold">{statusCounts[status] ?? 0}</div>
                  <div className="text-xs text-muted-foreground">{status}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {project.towers.map((tower) => (
                <div key={tower.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span className="font-medium">{tower.name}</span>
                  <span className="text-muted-foreground">
                    {tower.floors.length} floors · {tower.floors.flatMap((f) => f.units).length} units
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Budget range: {formatCurrency(project.minBudget ? Number(project.minBudget) : null)} - {formatCurrency(project.maxBudget ? Number(project.maxBudget) : null)}
              {project.reraNumber && ` · RERA: ${project.reraNumber}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Team</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {project.userAccess.map((access) => (
              <div key={access.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{access.user.name}</div>
                  <div className="text-xs text-muted-foreground">{ROLE_LABELS[access.user.role]}</div>
                </div>
                {canManage && (
                  <form action={revokeProjectAccess.bind(null, project.id, access.userId)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                )}
              </div>
            ))}
            {project.userAccess.length === 0 && (
              <p className="text-sm text-muted-foreground">No project-scoped users yet.</p>
            )}
            {canManage && teamUsers.length > 0 && (
              <form action={grantProjectAccess.bind(null, project.id)} className="mt-2 flex gap-2 border-t border-border pt-3">
                <Select name="userId" defaultValue="" className="flex-1">
                  <option value="" disabled>
                    Add team member
                  </option>
                  {teamUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({ROLE_LABELS[u.role]})
                    </option>
                  ))}
                </Select>
                <Button type="submit" size="sm" variant="secondary">
                  Add
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
