import Link from "next/link";
import { Plus, MapPin, Landmark } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, scopedProjectIds } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

const STATUS_BADGE: Record<string, "outline" | "success" | "warning" | "muted"> = {
  UPCOMING: "warning",
  ACTIVE: "success",
  COMPLETED: "outline",
  ON_HOLD: "muted",
};

export default async function ProjectsPage() {
  const user = await requireUser();
  const allowedProjectIds = await scopedProjectIds(user);

  const projects = await db.project.findMany({
    where: { id: { in: allowedProjectIds } },
    include: {
      _count: { select: { leads: true, bookings: true } },
      towers: { include: { floors: { include: { units: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">{projects.length} projects</p>
        </div>
        {can(user.role, "manageProjects") && (
          <Link href="/projects/new">
            <Button>
              <Plus /> New Project
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {projects.map((project) => {
          const units = project.towers.flatMap((t) => t.floors.flatMap((f) => f.units));
          const available = units.filter((u) => u.status === "AVAILABLE").length;
          return (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-3 pt-5">
                  <div className="flex items-start justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                      <Landmark className="size-4.5" />
                    </div>
                    <Badge variant={STATUS_BADGE[project.status]}>{project.status}</Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {project.city}, {project.state}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-xs">
                    <div>
                      <div className="font-semibold">{project._count.leads}</div>
                      <div className="text-muted-foreground">Leads</div>
                    </div>
                    <div>
                      <div className="font-semibold">{available}/{units.length}</div>
                      <div className="text-muted-foreground">Available</div>
                    </div>
                    <div>
                      <div className="font-semibold">{project._count.bookings}</div>
                      <div className="text-muted-foreground">Bookings</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(project.minBudget ? Number(project.minBudget) : null)} - {formatCurrency(project.maxBudget ? Number(project.maxBudget) : null)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
