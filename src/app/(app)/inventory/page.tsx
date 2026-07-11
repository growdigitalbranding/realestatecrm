import { db } from "@/lib/db";
import { requireUser, scopedProjectIds } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { createTower, createFloor, createUnit, updateUnitStatus } from "./actions";

const STATUS_BADGE: Record<string, "success" | "warning" | "outline" | "secondary" | "muted"> = {
  AVAILABLE: "success",
  BLOCKED: "warning",
  BOOKED: "outline",
  REGISTERED: "secondary",
  SOLD: "muted",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const allowedProjectIds = await scopedProjectIds(user);
  const canManage = can(user.role, "manageInventory");

  const projects = await db.project.findMany({ where: { id: { in: allowedProjectIds } } });
  const activeProjectId = params.projectId && allowedProjectIds.includes(params.projectId)
    ? params.projectId
    : projects[0]?.id;

  const project = activeProjectId
    ? await db.project.findUnique({
        where: { id: activeProjectId },
        include: {
          towers: {
            include: { floors: { include: { units: true }, orderBy: { number: "asc" } } },
            orderBy: { name: "asc" },
          },
        },
      })
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">Towers, floors and units</p>
        </div>
        <form method="get" className="flex items-center gap-2">
          <Select name="projectId" defaultValue={activeProjectId} className="w-56">
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary" size="sm">
            View
          </Button>
        </form>
      </div>

      {!project && <p className="text-sm text-muted-foreground">No project selected.</p>}

      {project && (
        <div className="flex flex-col gap-5">
          {canManage && (
            <Card className="p-4">
              <form action={createTower.bind(null, project.id)} className="flex items-end gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Add Tower</label>
                  <Input name="name" placeholder="e.g. Tower C" required className="w-48" />
                </div>
                <Button type="submit" size="sm" variant="secondary">
                  Add Tower
                </Button>
              </form>
            </Card>
          )}

          {project.towers.map((tower) => (
            <Card key={tower.id}>
              <CardHeader>
                <CardTitle>{tower.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {canManage && (
                  <form action={createFloor.bind(null, tower.id)} className="flex items-end gap-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Floor number</label>
                      <Input name="number" type="number" required className="w-28" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Floor name (optional)</label>
                      <Input name="name" className="w-40" />
                    </div>
                    <Button type="submit" size="sm" variant="secondary">
                      Add Floor
                    </Button>
                  </form>
                )}

                {tower.floors.map((floor) => (
                  <div key={floor.id} className="rounded-md border border-border">
                    <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
                      <span className="text-sm font-medium">{floor.name || `Floor ${floor.number}`}</span>
                      {canManage && (
                        <form action={createUnit.bind(null, floor.id)} className="flex items-center gap-1.5">
                          <Input name="unitNumber" placeholder="Unit #" className="h-7 w-20 text-xs" required />
                          <Input name="unitType" placeholder="Type" className="h-7 w-20 text-xs" />
                          <Input name="areaSqft" placeholder="Sqft" type="number" className="h-7 w-20 text-xs" />
                          <Input name="price" placeholder="Price" type="number" className="h-7 w-28 text-xs" />
                          <Button type="submit" size="sm" variant="outline" className="h-7">
                            Add Unit
                          </Button>
                        </form>
                      )}
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Unit</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead>Facing</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {floor.units.map((unit) => (
                          <TableRow key={unit.id}>
                            <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                            <TableCell className="text-sm">{unit.unitType ?? "-"}</TableCell>
                            <TableCell className="text-sm">{unit.areaSqft ? `${unit.areaSqft} sqft` : "-"}</TableCell>
                            <TableCell className="text-sm">{unit.facing ?? "-"}</TableCell>
                            <TableCell className="text-sm">{formatCurrency(unit.price ? Number(unit.price) : null)}</TableCell>
                            <TableCell>
                              {canManage ? (
                                <form action={updateUnitStatus.bind(null, unit.id)} className="flex items-center gap-1">
                                  <Select name="status" defaultValue={unit.status} className="h-7 w-32 text-xs">
                                    {["AVAILABLE", "BLOCKED", "BOOKED", "REGISTERED", "SOLD"].map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </Select>
                                  <Button type="submit" size="sm" variant="ghost" className="h-7">
                                    Save
                                  </Button>
                                </form>
                              ) : (
                                <Badge variant={STATUS_BADGE[unit.status]}>{unit.status}</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {floor.units.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="py-4 text-center text-xs text-muted-foreground">
                              No units on this floor yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {project.towers.length === 0 && (
            <p className="text-sm text-muted-foreground">No towers added yet for this project.</p>
          )}
        </div>
      )}
    </div>
  );
}
